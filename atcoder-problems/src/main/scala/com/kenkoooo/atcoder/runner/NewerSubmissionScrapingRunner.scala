package com.kenkoooo.atcoder.runner

import com.kenkoooo.atcoder.db.SqlDataStore
import com.kenkoooo.atcoder.model.{Contest, Submission}
import com.kenkoooo.atcoder.scraper.SubmissionScraper
import org.apache.logging.log4j.scala.Logging

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
                                    private[runner] val contests: List[Contest],
                                    private[runner] val page: Int,
                                    submissionScraper: SubmissionScraper,
                                    private[runner] val currentOverlapCount: Int,
                                    overlapThreshold: Int)
    extends SubmissionScrapingRunner
    with Logging {
  override def scrapeOnePage(): Option[NewerSubmissionScrapingRunner] = {
    val contest = contests.head
    val submissions = submissionScraper.scrape(contest.id, page)
    val newCount = (submissions.map(_.id).toSet -- sql.submissions.keySet).size
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
            1,
            submissionScraper,
            overlaps,
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
