package com.kenkoooo.atcoder.scraper

import java.net.SocketTimeoutException
import java.util.concurrent.TimeUnit

import net.ruippeixotog.scalascraper.browser.Browser
import org.mockito.ArgumentMatchers._
import org.mockito.Mockito.when
import org.scalatest.mockito.MockitoSugar
import org.scalatest.{FunSuite, Matchers}

import scala.concurrent.duration.Duration

class ContestScraperTest extends FunSuite with Matchers with MockitoSugar {
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

  test("timed out when scraping") {
    val browser = mock[Browser]
    when(browser.get(anyString())).thenAnswer(_ => {
      throw new SocketTimeoutException()
    })
    val scraper = new ContestScraper(Option(browser))
    scraper.scrapeAllContests()
  }
}
