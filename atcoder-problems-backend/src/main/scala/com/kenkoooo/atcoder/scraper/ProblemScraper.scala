package com.kenkoooo.atcoder.scraper

import com.kenkoooo.atcoder.Main.logger
import com.kenkoooo.atcoder.model.Problem
import net.ruippeixotog.scalascraper.browser.JsoupBrowser
import net.ruippeixotog.scalascraper.dsl.DSL._
import net.ruippeixotog.scalascraper.scraper.ContentExtractors.{element, elements}
import org.apache.logging.log4j.scala.Logging

import scala.util.Try

/**
  * scraper of information of problems
  **/
class ProblemScraper extends Logging {
  private val browser = JsoupBrowser()

  /**
    * Scrape problems from the contest page
    *
    * @param contest contest id to scrape problems
    * @return scraped problems
    */
  def scrape(contest: String): Try[Array[Problem]] = Try {
    logger.info(s"scraping problems of $contest")
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
      Problem(problemId, contest, problemTitle)
    }
    problems.toArray
  }
}
