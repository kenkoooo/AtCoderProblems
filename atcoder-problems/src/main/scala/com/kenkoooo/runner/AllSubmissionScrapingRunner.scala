package com.kenkoooo.runner

import com.kenkoooo.db.SqlDataStore
import com.kenkoooo.model.{Contest, Submission}
import com.kenkoooo.scraper.SubmissionScraper

/**
  * runner of scraper to scraper all the submissions
  *
  * @param sql               [[SqlDataStore]] to insert scraped submissions
  * @param contests          the list of [[Contest]] to scrape
  * @param page              the page number to scrape
  * @param submissionScraper [[SubmissionScraper]] used in scraping
  */
class AllSubmissionScrapingRunner(sql: SqlDataStore,
                                  contests: List[Contest] = List(),
                                  page: Int,
                                  submissionScraper: SubmissionScraper) {

  def scrapeOnePage(): Option[AllSubmissionScrapingRunner] = {
    val contest = contests.head
    val submissions = submissionScraper.scrape(contest.id, page)

    (submissions.isEmpty, contests.tail.isEmpty) match {
      case (true, true) =>
        None
      case (true, false) =>
        Some(new AllSubmissionScrapingRunner(sql, contests.tail, 1, submissionScraper))
      case (false, _) =>
        sql.batchInsert(Submission, submissions: _*)
        Some(new AllSubmissionScrapingRunner(sql, contests, page + 1, submissionScraper))
    }
  }
}
