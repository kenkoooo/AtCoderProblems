package com.kenkoooo.atcoder.runner

import com.kenkoooo.atcoder.db.SqlDataStore
import com.kenkoooo.atcoder.model.{Contest, Submission}
import com.kenkoooo.atcoder.scraper.SubmissionScraper

/**
  * runner of scraper to scrape all the submissions
  *
  * @param sql               [[SqlDataStore]] to insert scraped submissions
  * @param contests          the list of [[Contest]] to scrape
  * @param page              the page number to scrape
  * @param submissionScraper [[SubmissionScraper]] used in scraping
  */
class AllSubmissionScrapingRunner(sql: SqlDataStore,
                                  contests: List[Contest],
                                  private[runner] val page: Int = 0,
                                  submissionScraper: SubmissionScraper)
    extends SubmissionScrapingRunner(contests) {
  override def scrapeOnePage(): Option[AllSubmissionScrapingRunner] = {
    val contest = contests.head
    val submissions = submissionScraper.scrape(contest.id, page)

    (submissions.isEmpty, contests.tail.isEmpty) match {
      case (true, true) =>
        None
      case (true, false) =>
        Some(
          new AllSubmissionScrapingRunner(
            sql,
            contests.tail,
            Submission.FirstPageNumber,
            submissionScraper
          )
        )
      case (false, _) =>
        sql.batchInsert(Submission, submissions: _*)
        Some(new AllSubmissionScrapingRunner(sql, contests, page + 1, submissionScraper))
    }
  }
}
