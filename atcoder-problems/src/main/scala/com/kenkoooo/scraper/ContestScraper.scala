package com.kenkoooo.scraper

import java.util.concurrent.TimeUnit

import com.kenkoooo.model.Contest
import net.ruippeixotog.scalascraper.browser.JsoupBrowser
import net.ruippeixotog.scalascraper.dsl.DSL.Extract._
import net.ruippeixotog.scalascraper.dsl.DSL._

import scala.concurrent.duration.Duration
import scala.util.Try

class ContestScraper {
  private val browser = JsoupBrowser()

  private def scrape(page: Int): Array[Contest] = {
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
      val duration = Try {
        val hours = rows(2).text.split(":")(0).toInt
        val minutes = rows(2).text.split(":")(1).toInt
        Duration(hours * 60 + minutes, TimeUnit.MINUTES)
      }.getOrElse(Duration.Zero)
      Contest(
        id = contestId,
        startEpochSecond = AtCoder.parseDateTimeToEpochSecond(time),
        duration = duration
      )
    }
    contests.toArray
  }

  def scrapeAllContests(): Array[Contest] =
    Iterator
      .iterate((0, Array[Contest]())) { case (page, _) => (page + 1, scrape(page + 1)) }
      .takeWhile { case (page, contests) => page == 0 || contests.length > 0 }
      .map { case (_, contests) => contests }
      .toArray
      .flatten

}
