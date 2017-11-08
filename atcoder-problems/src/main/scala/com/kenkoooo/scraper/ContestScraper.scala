package com.kenkoooo.scraper

import net.ruippeixotog.scalascraper.browser.JsoupBrowser
import net.ruippeixotog.scalascraper.dsl.DSL.Extract._
import net.ruippeixotog.scalascraper.dsl.DSL._

class ContestScraper {
  private val browser = JsoupBrowser()

  def scrape(page: Int): Array[Contest] = {
    val url = s"${AtCoder.BaseUrl}contests/archive?lang=ja&page=$page"
    val doc = browser.get(url)
    val contests = for (tr <- doc >> elements("tbody > tr")) yield {
      val rows = (for (td <- tr >> elements("td")) yield td).toArray
      val time = rows(0).text
      val contestId = {
        val pattern = "^.*?contests/([a-zA-Z0-9-_]+)$".r
        val contestUrl = (rows(1) >> element("a")).attr("href")
        val pattern(id) = contestUrl
        id
      }
      Contest(id = contestId, startTime = time)
    }
    contests.toArray
  }
}

case class Contest(id: String, startTime: String)
