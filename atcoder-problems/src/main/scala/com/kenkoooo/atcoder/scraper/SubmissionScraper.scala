package com.kenkoooo.atcoder.scraper

import com.kenkoooo.atcoder.model.Submission
import net.ruippeixotog.scalascraper.browser.JsoupBrowser
import net.ruippeixotog.scalascraper.dsl.DSL.Extract._
import net.ruippeixotog.scalascraper.dsl.DSL._
import org.apache.logging.log4j.scala.Logging

import scala.util.{Failure, Success, Try}

class SubmissionScraper extends Logging {

  /**
    * scrape one page of submissions
    *
    * @param contest the id of contest, like "arc001"
    * @param page    the page number to scrape
    *
    **/
  def scrape(contest: String, page: Int): Array[Submission] = {
    val browser = JsoupBrowser()
    val url = s"${AtCoder.BaseUrl}contests/$contest/submissions?page=$page"

    logger.info(s"scraping $url...")
    val doc = browser.get(url)
    val submissions = for (tr <- doc >> elements("tbody > tr"))
      yield
        Try {
          val row = (for (td <- tr >> elements("td")) yield td).toArray
          val time = row(0).text

          val problemId = {
            val pattern = "^.*?tasks/([a-zA-Z0-9-_]+)$".r
            val problemUrl = (row(1) >> element("a")).attr("href")
            val pattern(id) = problemUrl
            id
          }

          val userId = {
            val pattern = "^.*?users/([a-zA-Z0-9-_]+)$".r
            val userUrl = (row(2) >> element("a")).attr("href")
            val pattern(userId) = userUrl
            userId
          }

          val language = row(3).text
          val point = row(4).text.toDouble
          val length = row(5).text.replaceAll(" Byte", "").toInt
          val result = row(6).text

          val (executionTime, idUrl) = {
            if (row.length == 10) {
              (Some(row(7).text.replaceAll(" ms", "").toInt), (row(9) >> element("a")).attr("href"))
            } else {
              (None, (row(7) >> element("a")).attr("href"))
            }
          }

          val id = {
            val pattern = "^.*?submissions/(\\d+)$".r
            val pattern(idStr) = idUrl
            idStr.toLong
          }

          Submission(
            epochSecond = AtCoder.parseDateTimeToEpochSecond(time),
            problemId = problemId,
            userId = userId,
            language = language,
            point = point,
            length = length,
            result = result,
            executionTime = executionTime,
            id = id
          )
        } match {
          case Success(submission) =>
            Some(submission)
          case Failure(e) =>
            logger.catching(e)
            None
        }
    submissions.flatten.filter(_.result.matches("^[A-Z]+$")).toArray
  }
}
