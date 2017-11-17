package com.kenkoooo.atcoder.runner

import com.kenkoooo.atcoder.db.SqlDataStore
import com.kenkoooo.atcoder.model.{Contest, Submission}
import com.kenkoooo.atcoder.scraper.SubmissionScraper
import org.mockito.Mockito
import org.scalatest.mockito.MockitoSugar
import org.scalatest.{FunSuite, Matchers}

class NewerSubmissionScrapingRunnerTest extends FunSuite with Matchers with MockitoSugar {
  test("scrape and create next runner with the next page number") {
    val currentPage = 114514
    val currentContestId = "rco-contest-2017-final-open"
    val overlappedId = 810893L

    val contest = Contest(currentContestId, 0, 0)

    val sql = mock[SqlDataStore]
    Mockito.when(sql.submissions).thenReturn(Map(overlappedId -> mock[Submission]))

    val scraper = mock[SubmissionScraper]
    val submission = mock[Submission]
    Mockito.when(submission.id).thenReturn(overlappedId)
    Mockito.when(scraper.scrape(currentContestId, currentPage)).thenReturn(Array(submission))

    val runner = new NewerSubmissionScrapingRunner(sql, List(contest), currentPage, scraper, 0, 10)
    val nextRunner = runner.scrapeOnePage()

    // check the scraper has been called
    Mockito.verify(scraper, Mockito.times(1)).scrape(currentContestId, currentPage)

    // check the runner has created the next runner
    nextRunner shouldBe defined

    // check the scraper has been created with the next page number and the next overlap count
    nextRunner.get.page shouldBe currentPage + 1
    nextRunner.get.currentOverlapCount shouldBe 1
  }

  test("scrape and create next runner with the next contest when the page is the last page") {
    val currentPage = 114514
    val currentContestId = "rco-contest-2017-final-open"
    val nextContestId = "rco-contest-2017-final"

    val sql = mock[SqlDataStore]
    Mockito.when(sql.submissions).thenReturn(Map[Long, Submission]())

    val scraper = mock[SubmissionScraper]
    Mockito.when(scraper.scrape(currentContestId, currentPage)).thenReturn(Array[Submission]())

    val runner = new NewerSubmissionScrapingRunner(
      sql,
      List(Contest(currentContestId, 0, 0), Contest(nextContestId, 0, 0)),
      currentPage,
      scraper,
      0,
      10
    )
    val nextRunner = runner.scrapeOnePage()

    // check the scraper has been called
    Mockito.verify(scraper, Mockito.times(1)).scrape(currentContestId, currentPage)

    // check the runner has created the next runner
    nextRunner shouldBe defined

    // check the scraper has been created with the next contest list
    nextRunner.get.page shouldBe 1
    nextRunner.get.contests.size shouldBe 1
    nextRunner.get.contests.head.id shouldBe nextContestId
    nextRunner.get.currentOverlapCount shouldBe 0
  }

  test("scrape and create next runner with the next contest when many submissions were overlapped") {
    val currentPage = 114514
    val currentContestId = "rco-contest-2017-final-open"
    val nextContestId = "rco-contest-2017-final"
    val overlappedSubmissionId = 810893L

    val sql = mock[SqlDataStore]
    Mockito.when(sql.submissions).thenReturn(Map(overlappedSubmissionId -> mock[Submission]))

    val scraper = mock[SubmissionScraper]
    Mockito.when(scraper.scrape(currentContestId, currentPage)).thenReturn(Array[Submission]())

    val runner = new NewerSubmissionScrapingRunner(
      sql,
      List(Contest(currentContestId, 0, 0), Contest(nextContestId, 0, 0)),
      currentPage,
      scraper,
      9,
      10
    )
    val nextRunner = runner.scrapeOnePage()

    // check the scraper has been called
    Mockito.verify(scraper, Mockito.times(1)).scrape(currentContestId, currentPage)

    // check the runner has created the next runner
    nextRunner shouldBe defined

    // check the scraper has been created with the next contest list
    nextRunner.get.page shouldBe Submission.FirstPageNumber
    nextRunner.get.contests.size shouldBe 1
    nextRunner.get.contests.head.id shouldBe nextContestId
    nextRunner.get.currentOverlapCount shouldBe 0
  }

  test("scrape and return None when all the contests are scraped") {
    val currentPage = 114514
    val currentContestId = "rco-contest-2017-final-open"

    val contest = Contest(currentContestId, 0, 0)

    val sql = mock[SqlDataStore]
    Mockito.when(sql.submissions).thenReturn(Map[Long, Submission]())

    val scraper = mock[SubmissionScraper]
    Mockito.when(scraper.scrape(currentContestId, currentPage)).thenReturn(Array[Submission]())

    val runner = new NewerSubmissionScrapingRunner(sql, List(contest), currentPage, scraper, 0, 10)
    val nextRunner = runner.scrapeOnePage()
    nextRunner shouldBe None
  }
}
