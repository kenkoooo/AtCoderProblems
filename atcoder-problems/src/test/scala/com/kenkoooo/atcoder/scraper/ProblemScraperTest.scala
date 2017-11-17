package com.kenkoooo.atcoder.scraper

import org.scalatest.{FunSuite, Matchers}

class ProblemScraperTest extends FunSuite with Matchers {
  test("scrape problems of ARC 084") {
    val scraper = new ProblemScraper
    val problems = scraper.scrape("arc084")

    problems.length shouldBe 4
    problems(0).id shouldBe "arc084_a"
    problems(0).title shouldBe "C. Snuke Festival"
  }
}
