package com.kenkoooo.atcoder.runner

import com.kenkoooo.atcoder.db.SqlViewer
import com.kenkoooo.atcoder.db.traits.SqlInsert
import com.kenkoooo.atcoder.model.{Contest, Submission}
import com.kenkoooo.atcoder.runner.NewerSubmissionScrapingRunner._
import com.kenkoooo.atcoder.scraper.SubmissionScraper
import org.apache.logging.log4j.scala.Logging

/**
  * runner of scraper to scrape only the new submissions
  *
  * @param sqlViewer                 [[SqlViewer]] to insert scraped submissions
  * @param contests            the list of [[Contest]] to scrape
  * @param page                the page number to scrape
  * @param submissionScraper   [[SubmissionScraper]] used in scraping
  * @param currentOverlapCount the number of currently overlapped submissions
  * @param overlapThreshold    threshold to change the contest
  */
class NewerSubmissionScrapingRunner(sqlViewer: SqlViewer,
                                    sqlInsert: SqlInsert,
                                    override val contests: List[Contest],
                                    private[runner] val page: Int = Submission.FirstPageNumber,
                                    submissionScraper: SubmissionScraper,
                                    private[runner] val currentOverlapCount: Int = 0,
                                    overlapThreshold: Int = DefaultOverlapThreshold)
    extends SubmissionScrapingRunner
    with Logging {
  override def scrapeOnePage(): NewerSubmissionScrapingRunner = {
    val contest = contests.head
    val submissions = submissionScraper.scrape(contest.id, page)
    val newCount = submissions.length - sqlViewer.loadSubmissions(submissions.map(_.id): _*).size
    val overlaps = submissions.length - newCount + currentOverlapCount
    logger.info(s"$overlaps submissions overlapped in ${contest.id}")

    if (submissions.isEmpty || overlaps > overlapThreshold) {
      if (contests.tail.isEmpty) {
        this.createNext(sqlViewer.loadContest())
      } else {
        this.createNext(contests.tail)
      }
    } else {
      sqlInsert.batchInsert(Submission, submissions: _*)
      this.createNext(contests, page + 1, overlaps)
    }
  }

  private def createNext(nextContests: List[Contest],
                         nextPage: Int = Submission.FirstPageNumber,
                         nextOverlapCount: Int = 0): NewerSubmissionScrapingRunner = {
    new NewerSubmissionScrapingRunner(
      sqlViewer = this.sqlViewer,
      sqlInsert = this.sqlInsert,
      submissionScraper = this.submissionScraper,
      contests = nextContests,
      page = nextPage,
      currentOverlapCount = nextOverlapCount
    )
  }
}

private object NewerSubmissionScrapingRunner {
  private val DefaultOverlapThreshold = 30
}
