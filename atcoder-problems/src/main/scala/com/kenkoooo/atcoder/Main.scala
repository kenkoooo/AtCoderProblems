package com.kenkoooo.atcoder

import java.util.concurrent.{Executors, TimeUnit}

import akka.actor.ActorSystem
import akka.http.scaladsl.Http
import akka.stream.ActorMaterializer
import com.kenkoooo.atcoder.api.SqlApi
import com.kenkoooo.atcoder.common.Configure
import com.kenkoooo.atcoder.common.ScheduledExecutorServiceExtension._
import com.kenkoooo.atcoder.db.SqlClient
import com.kenkoooo.atcoder.model.{Contest, Problem}
import com.kenkoooo.atcoder.runner.{
  AllSubmissionScrapingRunner,
  NewerSubmissionScrapingRunner,
  SubmissionScrapingRunner
}
import com.kenkoooo.atcoder.scraper.{ContestScraper, ProblemScraper, SubmissionScraper}
import org.apache.logging.log4j.scala.Logging

import scala.util.{Failure, Success}
import TimeUnit.{MINUTES, HOURS, MILLISECONDS}

object Main extends Logging {
  implicit val system: ActorSystem = ActorSystem()
  implicit val materializer: ActorMaterializer = ActorMaterializer()

  def main(args: Array[String]): Unit = {
    Configure(args(0)) match {
      case Success(config) =>
        val service = Executors.newScheduledThreadPool(config.scraper.threads)
        val sql = new SqlClient(
          url = config.sql.url,
          user = config.sql.user,
          password = config.sql.password
        )
        val contestScraper = new ContestScraper
        val submissionScraper = new SubmissionScraper
        val problemScraper = new ProblemScraper
        sql.batchInsert(Contest, contestScraper.scrapeAllContests(): _*)
        sql.reloadRecords()

        // scrape submission pages per 0.5 second
        def executeScrapingJob(defaultRunner: () => SubmissionScrapingRunner): Unit = {
          var runner = defaultRunner()
          service.tryAtFixedDelay(500, 500, MILLISECONDS) {
            runner = runner.scrapeOnePage().getOrElse(defaultRunner())
          }
        }

        executeScrapingJob { () =>
          new AllSubmissionScrapingRunner(
            sql = sql,
            contests = sql.contests.values.toList,
            submissionScraper = submissionScraper
          )
        }
        executeScrapingJob { () =>
          new NewerSubmissionScrapingRunner(
            sql = sql,
            contests = sql.contests.values.toList,
            submissionScraper = submissionScraper
          )
        }

        // reload records per minute
        service.tryAtFixedDelay(0, 1, MINUTES)(sql.reloadRecords())

        // scrape contests per hour
        service.tryAtFixedDelay(0, 1, HOURS) {
          sql.batchInsert(Contest, contestScraper.scrapeAllContests(): _*)
        }

        // scrape problems per minutes
        service.tryAtFixedDelay(1, 1, MINUTES) {
          sql.contests.keySet
            .find(contestId => sql.problems.values.forall(_.contestId != contestId))
            .foreach(contestId => sql.batchInsert(Problem, problemScraper.scrape(contestId): _*))
        }

        // update tables every 5 minutes
        service.tryAtFixedDelay(0, 5, MINUTES)(sql.batchUpdateStatisticTables())

        val port = config.server.port
        val api = new SqlApi(sql)

        Http().bindAndHandle(api.routes, interface = "0.0.0.0", port = port)

      case Failure(e) => logger.catching(e)
    }
  }
}
