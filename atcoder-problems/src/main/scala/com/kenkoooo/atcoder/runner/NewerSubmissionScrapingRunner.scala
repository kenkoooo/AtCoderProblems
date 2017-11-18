package com.kenkoooo.atcoder.runner

import com.kenkoooo.atcoder.db.SqlDataStore
import com.kenkoooo.atcoder.model.{Contest, Submission}
import com.kenkoooo.atcoder.scraper.SubmissionScraper
import org.apache.logging.log4j.scala.Logging
import NewerSubmissionScrapingRunner._

/**
  * runner of scraper to scrape only the new submissions
  *
  * @param sql                 [[SqlDataStore]] to insert scraped submissions
  * @param contests            the list of [[Contest]] to scrape
  * @param page                the page number to scrape
  * @param submissionScraper   [[SubmissionScraper]] used in scraping
  * @param currentOverlapCount the number of currently overlapped submissions
  * @param overlapThreshold    threshold to change the contest
  */
class NewerSubmissionScrapingRunner(sql: SqlDataStore,
                                    contests: List[Contest],
                                    private[runner] val page: Int = 0,
                                    submissionScraper: SubmissionScraper,
                                    private[runner] val currentOverlapCount: Int = 0,
                                    overlapThreshold: Int = DefaultOverlapThreshold)
    extends SubmissionScrapingRunner(contests)
    with Logging {
  override def scrapeOnePage(): Option[NewerSubmissionScrapingRunner] = {
    val contest = contests.head
    val submissions = submissionScraper.scrape(contest.id, page)
    val newCount = submissions.length - sql.submission(submissions.map(_.id): _*).size
    val overlaps = submissions.length - newCount + currentOverlapCount
    logger.info(s"$overlaps submissions overlapped in ${contest.id}")

    (submissions.isEmpty || overlaps > overlapThreshold, contests.tail.isEmpty) match {
      case (true, true) =>
        None
      case (true, false) =>
        Some(
          new NewerSubmissionScrapingRunner(
            sql,
            contests.tail,
            Submission.FirstPageNumber,
            submissionScraper,
            0,
            overlapThreshold
          )
        )
      case (false, _) =>
        sql.batchInsert(Submission, submissions: _*)
        Some(
          new NewerSubmissionScrapingRunner(
            sql,
            contests,
            page + 1,
            submissionScraper,
            overlaps,
            overlapThreshold
          )
        )
    }
  }
}

private object NewerSubmissionScrapingRunner {
  private val DefaultOverlapThreshold = 100
}
