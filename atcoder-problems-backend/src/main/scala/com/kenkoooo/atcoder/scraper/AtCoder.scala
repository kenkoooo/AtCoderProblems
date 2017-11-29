package com.kenkoooo.atcoder.scraper

import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter

object AtCoder {
  val BaseUrl = "https://beta.atcoder.jp/"

  private val timeFormatPattern = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ssXXXX")

  /**
    * parse string formatted date and time to epoch second
    *
    * @param dateTimeString string formatted date and time like "1991-07-17 10:20:30+0900"
    * @return epoch second
    */
  def parseDateTimeToEpochSecond(dateTimeString: String): Long =
    OffsetDateTime.parse(dateTimeString, timeFormatPattern).toEpochSecond

  val UserNameRegex = "^[0-9a-zA-Z-_]+$"
}
