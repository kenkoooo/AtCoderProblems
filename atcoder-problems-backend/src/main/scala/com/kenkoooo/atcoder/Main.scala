package com.kenkoooo.atcoder

import java.util.concurrent.TimeUnit.{HOURS, MILLISECONDS, MINUTES}
import java.util.concurrent.{Executors, ScheduledExecutorService}

import akka.actor.ActorSystem
import akka.http.scaladsl.Http
import akka.stream.ActorMaterializer
import com.kenkoooo.atcoder.api.JsonApi
import com.kenkoooo.atcoder.common.Configure
import com.kenkoooo.atcoder.common.ScheduledExecutorServiceExtension._
import com.kenkoooo.atcoder.db.SqlClient
import com.kenkoooo.atcoder.model.{Contest, Problem}
import com.kenkoooo.atcoder.runner.{AllSubmissionScrapingRunner, NewerSubmissionScrapingRunner}
import com.kenkoooo.atcoder.scraper.{ContestScraper, ProblemScraper, SubmissionScraper}
import org.apache.logging.log4j.scala.Logging

import scala.util.{Failure, Success}

object Main extends Logging {
  implicit val system: ActorSystem = ActorSystem()
  implicit val materializer: ActorMaterializer = ActorMaterializer()

  def main(args: Array[String]): Unit = {
    Configure(args(0)) match {
      case Success(config) =>
        val service: ScheduledExecutorService =
          Executors.newScheduledThreadPool(config.scraper.threads)
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
        var allRunner = new AllSubmissionScrapingRunner(
          sql = sql,
          contests = sql.contests.values.toList,
          submissionScraper = submissionScraper
        )
        var newRunner = new NewerSubmissionScrapingRunner(
          sql = sql,
          contests = sql.contests.values.toList,
          submissionScraper = submissionScraper
        )

        service.tryAtFixedDelay(500, 500, MILLISECONDS) {
          allRunner = allRunner.scrapeOnePage()
          newRunner = newRunner.scrapeOnePage()
        }

        // reload records per minute
        service.tryAtFixedDelay(0, 1, MINUTES)(sql.reloadRecords())

        // scrape contests per hour
        service.tryAtFixedDelay(0, 1, HOURS) {
          sql.batchInsert(Contest, contestScraper.scrapeAllContests(): _*)
        }

        // scrape problems per hour
        service.tryAtFixedDelay(0, 1, HOURS) {
          sql.loadNoProblemContestList().foreach { contestId =>
            problemScraper.scrape(contestId) match {
              case Success(problems) => sql.batchInsert(Problem, problems: _*)
              case Failure(e)        => logger.catching(e)
            }
          }
        }

        // update tables every 5 minutes
        service.tryAtFixedDelay(0, 5, MINUTES)(sql.batchUpdateStatisticTables())

        val port = config.server.port
        val api = new JsonApi(sql)

        Http().bindAndHandle(api.routes, interface = "0.0.0.0", port = port)

      case Failure(e) => logger.catching(e)
    }
  }
}
