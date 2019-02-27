package com.kenkoooo.atcoder

import java.util.concurrent.TimeUnit.{HOURS, MILLISECONDS, MINUTES}
import java.util.concurrent.{Executors, ScheduledExecutorService}

import akka.actor.ActorSystem
import akka.http.scaladsl.Http
import akka.stream.ActorMaterializer
import com.kenkoooo.atcoder.api.JsonApi
import com.kenkoooo.atcoder.common.Configure
import com.kenkoooo.atcoder.common.JsonWriter._
import com.kenkoooo.atcoder.common.ScheduledExecutorServiceExtension._
import com.kenkoooo.atcoder.db.{SqlUpdater, SqlViewer}
import com.kenkoooo.atcoder.model.{ApiJsonSupport, Contest, Problem}
import com.kenkoooo.atcoder.runner.{AllSubmissionScrapingRunner, NewerSubmissionScrapingRunner}
import com.kenkoooo.atcoder.scraper.{ContestScraper, ProblemScraper, SubmissionScraper}
import org.apache.logging.log4j.scala.Logging
import scalikejdbc.ConnectionPool

import scala.util.{Failure, Success}

object Main extends Logging with ApiJsonSupport {
  implicit val system: ActorSystem = ActorSystem()
  implicit val materializer: ActorMaterializer = ActorMaterializer()

  def main(args: Array[String]): Unit = {
    Configure(args(0)) match {
      case Success(config) =>
        val service: ScheduledExecutorService =
          Executors.newScheduledThreadPool(config.scraper.threads)

        Class.forName("org.postgresql.Driver")
        ConnectionPool.singleton(
          url = config.sql.url,
          user = config.sql.user,
          password = config.sql.password
        )

        val sqlViewer = new SqlViewer()
        val sqlUpdater = new SqlUpdater()
        val contestScraper = new ContestScraper
        val submissionScraper = new SubmissionScraper
        val problemScraper = new ProblemScraper
        sqlUpdater.batchInsert(Contest, contestScraper.scrapeAllContests(): _*)
        sqlViewer.reloadRecords()

        // scrape submission pages per 0.5 second
        var allRunner = new AllSubmissionScrapingRunner(
          contestLoader = sqlViewer,
          sqlInsert = sqlUpdater,
          contests = sqlViewer.loadContest(),
          submissionScraper = submissionScraper
        )
        var newRunner = new NewerSubmissionScrapingRunner(
          sql = sqlViewer,
          sqlInsert = sqlUpdater,
          contests = sqlViewer.loadContest(),
          submissionScraper = submissionScraper
        )

        service.tryAtFixedDelay(500, 500, MILLISECONDS) {
          allRunner = allRunner.scrapeOnePage()
          newRunner = newRunner.scrapeOnePage()
        }

        // reload records per minute
        service.tryAtFixedDelay(0, 1, MINUTES)({
          sqlViewer.reloadRecords()

          sqlViewer.loadContest().toJsonFile(s"${config.files.path}/contests.json")
          sqlViewer.problems.values.toList.toJsonFile(s"${config.files.path}/problems.json")
          sqlViewer.acceptedCounts.toJsonFile(s"${config.files.path}/ac.json")
          sqlViewer.fastestSubmissionCounts.toJsonFile(s"${config.files.path}/fast.json")
          sqlViewer.firstSubmissionCounts.toJsonFile(s"${config.files.path}/first.json")
          sqlViewer.shortestSubmissionCounts.toJsonFile(s"${config.files.path}/short.json")
          sqlViewer.mergedProblems.toJsonFile(s"${config.files.path}/merged-problems.json")
          sqlViewer.ratedPointSums.toJsonFile(s"${config.files.path}/sums.json")
          sqlViewer.languageCounts.toJsonFile(s"${config.files.path}/lang.json")
        })

        // scrape contests per hour
        service.tryAtFixedDelay(0, 1, HOURS) {
          sqlUpdater.batchInsert(Contest, contestScraper.scrapeAllContests(): _*)
        }

        // scrape problems per hour
        service.tryAtFixedDelay(0, 1, HOURS) {
          sqlViewer.loadNoProblemContestList().foreach { contestId =>
            problemScraper.scrape(contestId) match {
              case Success(problems) => sqlUpdater.batchInsert(Problem, problems: _*)
              case Failure(e)        => logger.catching(e)
            }
          }
        }

        // update tables every 5 minutes
        service.tryAtFixedDelay(0, 5, MINUTES)(sqlUpdater.updateAll())

        val port = config.server.port
        val api = new JsonApi(sqlViewer)

        Http().bindAndHandle(api.routes, interface = "0.0.0.0", port = port)

      case Failure(e) => logger.catching(e)
    }
  }
}
