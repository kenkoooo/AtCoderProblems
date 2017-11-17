package com.kenkoooo.scraper

import org.scalatest.{FunSuite, Matchers}

class SubmissionScraperTest extends FunSuite with Matchers {
  test("scrape submissions") {
    val submissions = new SubmissionScraper().scrape("arc001", 10)

    submissions.length shouldBe 20
  }
}
