package com.kenkoooo.atcoder.runner

import com.kenkoooo.atcoder.db.traits.{ContestLoader, SqlInsert}
import com.kenkoooo.atcoder.model.{Contest, Submission}
import com.kenkoooo.atcoder.scraper.SubmissionScraper

/**
  * runner of scraper to scrape all the submissions
  *
  * @param contestLoader     [[ContestLoader]] to get contest list
  * @param sqlInsert         [[SqlInsert]]
  * @param contests          the list of [[Contest]] to scrape
  * @param page              the page number to scrape
  * @param submissionScraper [[SubmissionScraper]] used in scraping
  */
class AllSubmissionScrapingRunner(contestLoader: ContestLoader,
                                  sqlInsert: SqlInsert,
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
          contestLoader = contestLoader,
          sqlInsert = sqlInsert,
          contests = contestLoader.loadContest(),
          submissionScraper = submissionScraper
        )
      case (true, false) =>
        new AllSubmissionScrapingRunner(
          contestLoader = contestLoader,
          sqlInsert = sqlInsert,
          contests = contests.tail,
          submissionScraper = submissionScraper
        )
      case (false, _) =>
        sqlInsert.batchInsert(Submission, submissions: _*)
        new AllSubmissionScrapingRunner(
          contestLoader = contestLoader,
          sqlInsert = sqlInsert,
          contests = contests,
          page = page + 1,
          submissionScraper = submissionScraper
        )
    }
  }
}
