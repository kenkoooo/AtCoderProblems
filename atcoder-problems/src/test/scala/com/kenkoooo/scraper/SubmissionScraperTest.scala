package com.kenkoooo.scraper

import org.scalatest.{FunSuite, Matchers}

class SubmissionScraperTest extends FunSuite with Matchers {
  test("scrape submissions") {
    val scraper = new SubmissionScraper("arc080")
    val submissions = scraper.scrape(10)

    submissions.length shouldBe 20
    AtCoder.parseDateTimeToEpochSecond(submissions(0).datetime)
  }
}
