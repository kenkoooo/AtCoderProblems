package com.kenkoooo.scraper

import org.scalatest.FunSuite

class ContestScraperTest extends FunSuite {
  test("sc") {
    val scraper = new ContestScraper

    scraper.scrape(8)
  }
}
