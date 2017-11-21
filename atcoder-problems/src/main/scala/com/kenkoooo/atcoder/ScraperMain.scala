package com.kenkoooo.atcoder

import java.util.concurrent.{Executors, TimeUnit}

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

object ScraperMain extends Logging {
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
          service.scheduleTryJobAtFixedDelay(() => {
            runner = runner.scrapeOnePage().getOrElse(defaultRunner())
          }, 500, 500, TimeUnit.MILLISECONDS)
        }

        executeScrapingJob(
          () =>
            new AllSubmissionScrapingRunner(
              sql = sql,
              contests = sql.contests.values.toList,
              submissionScraper = submissionScraper
          )
        )
        executeScrapingJob(
          () =>
            new NewerSubmissionScrapingRunner(
              sql = sql,
              contests = sql.contests.values.toList,
              submissionScraper = submissionScraper
          )
        )

        // reload records per minute
        service.scheduleTryJobAtFixedDelay(() => sql.reloadRecords(), 0, 1, TimeUnit.MINUTES)

        // scrape contests per hour
        service.scheduleTryJobAtFixedDelay(() => {
          sql.batchInsert(Contest, contestScraper.scrapeAllContests(): _*)
        }, 0, 1, TimeUnit.HOURS)

        // scrape problems per minutes
        service.scheduleTryJobAtFixedDelay(
          () =>
            sql.contests.keySet
              .find { contestId =>
                sql.problems.values.forall(_.contestId != contestId)
              }
              .foreach { contestId =>
                logger.info(s"scraping $contestId")
                sql.batchInsert(Problem, problemScraper.scrape(contestId): _*)
            },
          1,
          1,
          TimeUnit.MINUTES
        )

        // update tables every 5 minutes
        service.scheduleTryJobAtFixedDelay(() => {
          logger.info("start batch table update")
          sql.batchUpdateStatisticTables()
          logger.info("finished batch table update")
        }, 0, 5, TimeUnit.MINUTES)
      case Failure(e) => logger.catching(e)
    }
  }
}
