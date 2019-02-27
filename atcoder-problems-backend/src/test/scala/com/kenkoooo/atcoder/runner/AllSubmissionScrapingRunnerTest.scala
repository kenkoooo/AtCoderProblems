package com.kenkoooo.atcoder.runner

import com.kenkoooo.atcoder.db.traits.{ContestLoader, SqlInsert}
import com.kenkoooo.atcoder.model.{Contest, Submission}
import com.kenkoooo.atcoder.scraper.SubmissionScraper
import org.mockito.Mockito
import org.scalatest.mockito.MockitoSugar
import org.scalatest.{FunSuite, Matchers}

class AllSubmissionScrapingRunnerTest extends FunSuite with Matchers with MockitoSugar {
  test("scrape and create next runner with the next page number") {
    val currentPage = 114514
    val currentContestId = "rco-contest-2017-final-open"

    val contest = Contest(currentContestId, 0, 0, "", "")

    val contestLoader = mock[ContestLoader]
    val sqlInsert = mock[SqlInsert]

    val scraper = mock[SubmissionScraper]
    val submission = mock[Submission]
    Mockito.when(scraper.scrape(currentContestId, currentPage)).thenReturn(Array(submission))

    val runner =
      new AllSubmissionScrapingRunner(contestLoader, sqlInsert, List(contest), currentPage, scraper)
    val nextRunner = runner.scrapeOnePage()

    // check the scraper has been called
    Mockito.verify(scraper, Mockito.times(1)).scrape(currentContestId, currentPage)

    // check the scraper has been created with the next page number
    nextRunner.page shouldBe currentPage + 1
  }

  test("scrape and create next runner with the next contest") {
    val currentPage = 114514
    val currentContestId = "rco-contest-2017-final-open"
    val nextContestId = "rco-contest-2017-final"

    val contestLoader = mock[ContestLoader]
    val sqlInsert = mock[SqlInsert]

    val scraper = mock[SubmissionScraper]
    Mockito.when(scraper.scrape(currentContestId, currentPage)).thenReturn(Array[Submission]())

    val runner = new AllSubmissionScrapingRunner(
      contestLoader,
      sqlInsert,
      List(Contest(currentContestId, 0, 0, "", ""), Contest(nextContestId, 0, 0, "", "")),
      currentPage,
      scraper
    )
    val nextRunner = runner.scrapeOnePage()

    // check the scraper has been called
    Mockito.verify(scraper, Mockito.times(1)).scrape(currentContestId, currentPage)

    // check the scraper has been created with the next contest list
    nextRunner.page shouldBe Submission.FirstPageNumber
    nextRunner.contests.size shouldBe 1
    nextRunner.contests.head.id shouldBe nextContestId
  }

  test("scrape and return None when all the contests are scraped") {
    val currentPage = 114514
    val currentContestId = "rco-contest-2017-final-open"

    val contest = Contest(currentContestId, 0, 0, "", "")

    val contestLoader = mock[ContestLoader]
    val sqlInsert = mock[SqlInsert]

    Mockito.when(contestLoader.loadContest()).thenReturn(List(contest))

    val scraper = mock[SubmissionScraper]
    Mockito.when(scraper.scrape(currentContestId, currentPage)).thenReturn(Array[Submission]())

    val runner =
      new AllSubmissionScrapingRunner(contestLoader, sqlInsert, List(contest), currentPage, scraper)
    val nextRunner = runner.scrapeOnePage()
    nextRunner.page shouldBe Submission.FirstPageNumber
    Mockito.verify(contestLoader, Mockito.times(1)).loadContest()
  }
}
