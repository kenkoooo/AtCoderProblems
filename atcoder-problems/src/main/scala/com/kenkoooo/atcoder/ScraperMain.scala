package com.kenkoooo.atcoder

import java.io.File
import java.util.concurrent.{Executors, TimeUnit}

import com.kenkoooo.atcoder.common.Configure
import com.kenkoooo.atcoder.common.ScheduledExecutorServiceExtension._
import com.kenkoooo.atcoder.db.SqlDataStore
import com.kenkoooo.atcoder.model.{Contest, Problem}
import com.kenkoooo.atcoder.runner.{
  AllSubmissionScrapingRunner,
  NewerSubmissionScrapingRunner,
  SubmissionScrapingRunner
}
import com.kenkoooo.atcoder.scraper.{ContestScraper, ProblemScraper, SubmissionScraper}
import com.typesafe.config.ConfigFactory.parseFile
import org.apache.logging.log4j.scala.Logging
import pureconfig.loadConfig

object ScraperMain extends Logging {
  def main(args: Array[String]): Unit = {
    loadConfig[Configure](parseFile(new File(args(0)))) match {
      case Right(config) =>
        val service = Executors.newScheduledThreadPool(config.scraper.threads)
        val sql = new SqlDataStore(
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
          service.scheduleTryJobAtFixedRate(() => {
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
        service.scheduleTryJobAtFixedRate(() => sql.reloadRecords(), 0, 1, TimeUnit.MINUTES)

        // scrape contests per hour
        service.scheduleTryJobAtFixedRate(() => {
          sql.batchInsert(Contest, contestScraper.scrapeAllContests(): _*)
        }, 0, 1, TimeUnit.HOURS)

        // scrape problems per minutes
        service.scheduleTryJobAtFixedRate(
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
      case Left(e) => e.toList.foreach(f => logger.error(f.description))
    }
  }
}
