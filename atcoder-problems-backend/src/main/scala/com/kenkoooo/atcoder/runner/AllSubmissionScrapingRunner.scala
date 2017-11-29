package com.kenkoooo.atcoder.runner

import com.kenkoooo.atcoder.db.SqlClient
import com.kenkoooo.atcoder.model.{Contest, Submission}
import com.kenkoooo.atcoder.scraper.SubmissionScraper

/**
  * runner of scraper to scrape all the submissions
  *
  * @param sql               [[SqlClient]] to insert scraped submissions
  * @param contests          the list of [[Contest]] to scrape
  * @param page              the page number to scrape
  * @param submissionScraper [[SubmissionScraper]] used in scraping
  */
class AllSubmissionScrapingRunner(sql: SqlClient,
                                  contests: List[Contest],
                                  private[runner] val page: Int = Submission.FirstPageNumber,
                                  submissionScraper: SubmissionScraper)
    extends SubmissionScrapingRunner(contests) {
  override def scrapeOnePage(): AllSubmissionScrapingRunner = {
    val contest = contests.head
    val submissions = submissionScraper.scrape(contest.id, page)

    (submissions.isEmpty, contests.tail.isEmpty) match {
      case (true, true) =>
        new AllSubmissionScrapingRunner(
          sql = sql,
          contests = sql.contests.values.toList,
          submissionScraper = submissionScraper
        )
      case (true, false) =>
        new AllSubmissionScrapingRunner(
          sql = sql,
          contests = contests.tail,
          submissionScraper = submissionScraper
        )
      case (false, _) =>
        sql.batchInsert(Submission, submissions: _*)
        new AllSubmissionScrapingRunner(
          sql = sql,
          contests = contests,
          page = page + 1,
          submissionScraper = submissionScraper
        )
    }
  }
}
