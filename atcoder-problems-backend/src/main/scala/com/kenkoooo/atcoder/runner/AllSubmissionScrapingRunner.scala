package com.kenkoooo.atcoder.runner

import com.kenkoooo.atcoder.db.traits.{ContestLoader, SqlInsert}
import com.kenkoooo.atcoder.model.{Contest, Submission}
import com.kenkoooo.atcoder.scraper.SubmissionScraper

/**
  * runner of scraper to scrape all the submissions
  *
  * @param contestLoader     [[ContestLoader]] to get contest list
  * @param sqlInsert         [[SqlInsert]] to insert data to SQL
  * @param contests          the list of [[Contest]] to scrape
  * @param page              the page number to scrape
  * @param submissionScraper [[SubmissionScraper]] used in scraping
  */
class AllSubmissionScrapingRunner(contestLoader: ContestLoader,
                                  sqlInsert: SqlInsert,
                                  override val contests: List[Contest],
                                  private[runner] val page: Int = Submission.FirstPageNumber,
                                  submissionScraper: SubmissionScraper)
    extends SubmissionScrapingRunner {
  private def createNext(nextContests: List[Contest],
                         nextPage: Int = Submission.FirstPageNumber): AllSubmissionScrapingRunner =
    new AllSubmissionScrapingRunner(
      contestLoader = contestLoader,
      sqlInsert = sqlInsert,
      contests = nextContests,
      page = nextPage,
      submissionScraper = submissionScraper
    )

  override def scrapeOnePage(): AllSubmissionScrapingRunner = {
    val contest = contests.head
    val submissions = submissionScraper.scrape(contest.id, page)

    if (submissions.isEmpty) {
      if (contests.tail.isEmpty) {
        this.createNext(contestLoader.loadContest())
      } else {
        this.createNext(contests.tail)
      }
    } else {
      sqlInsert.batchInsert(Submission, submissions: _*)
      this.createNext(contests, page + 1)
    }
  }
}
