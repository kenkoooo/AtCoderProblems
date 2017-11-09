package com.kenkoooo.scraper

import org.scalatest.{FunSuite, Matchers}

class ContestScraperTest extends FunSuite with Matchers {
  test("scrape contest list") {
    val scraper = new ContestScraper
    val contests = scraper.scrapeAllContests()
    contests.length should be >= 394
    contests.find(_.id == "arc084").get.startEpochSecond shouldBe 1509796800
  }
}
