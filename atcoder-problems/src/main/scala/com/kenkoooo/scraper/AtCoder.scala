package com.kenkoooo.scraper

import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter

object AtCoder {
  val BaseUrl = "https://beta.atcoder.jp/"

  private val timeFormatPattern = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ssXXXX")

  def parseDateTimeToEpochSecond(dateTimeString: String): Long =
    OffsetDateTime.parse(dateTimeString, timeFormatPattern).toEpochSecond
}
