package com.kenkoooo.atcoder.scraper

import java.util.concurrent.TimeUnit

import org.scalatest.{FunSuite, Matchers}

import scala.concurrent.duration.Duration

class ContestScraperTest extends FunSuite with Matchers {
  test("scrape contest list") {
    val scraper = new ContestScraper
    val contests = scraper.scrapeAllContests()
    contests.length should be >= 394
    contests.find(_.id == "arc084").get.startEpochSecond shouldBe 1509796800
    contests
      .find(_.id == "arc084")
      .get
      .durationSecond shouldBe Duration(100, TimeUnit.MINUTES).toSeconds
    contests.foreach { contest =>
      contest.title.length should be > 0
    }
  }
}
