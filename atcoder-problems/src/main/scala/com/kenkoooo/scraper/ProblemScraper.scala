package com.kenkoooo.scraper

import com.kenkoooo.model.Problem
import net.ruippeixotog.scalascraper.browser.JsoupBrowser
import net.ruippeixotog.scalascraper.dsl.DSL._
import net.ruippeixotog.scalascraper.scraper.ContentExtractors.{element, elements}

class ProblemScraper {
  private val browser = JsoupBrowser()

  def scrape(contest: String): Array[Problem] = {
    val url = s"${AtCoder.BaseUrl}contests/$contest/tasks"
    val doc = browser.get(url)
    val problems = for (tr <- doc >> elements("tbody > tr")) yield {
      val rows = (for (td <- tr >> elements("td")) yield td).toArray
      val problemTitle = s"${rows(0).text}. ${rows(1).text}"

      val problemId = {
        val pattern = "^.*?tasks/([a-zA-Z0-9-_]+)$".r
        val problemUrl = (rows(0) >> element("a")).attr("href")
        val pattern(id) = problemUrl
        id
      }
      Problem(problemId, problemTitle)
    }
    problems.toArray
  }
}
