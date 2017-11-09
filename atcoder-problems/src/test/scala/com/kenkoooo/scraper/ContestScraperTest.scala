package com.kenkoooo.scraper

import org.scalatest.{FunSuite, Matchers}

class ContestScraperTest extends FunSuite with Matchers {
  test("scrape contest list") {
    val scraper = new ContestScraper

    var finish = false
    var page = 1
    while (!finish) {
      val contests = scraper.scrape(page)
      if (contests.isEmpty) {
        finish = true
      } else {
        page += 1
      }
    }
    page should be >= 9
  }
}
