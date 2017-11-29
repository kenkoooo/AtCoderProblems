package com.kenkoooo.atcoder.api

import java.nio.charset.StandardCharsets
import java.security.MessageDigest

import akka.http.scaladsl.model.DateTime
import akka.http.scaladsl.model.headers.EntityTag

object EntityTagger {
  private val md5 = MessageDigest.getInstance("MD5")

  private def md5Sum(value: String) = {
    md5.digest(value.getBytes(StandardCharsets.UTF_8)).map("%02x".format(_)).mkString
  }

  def calculateDateTimeTag(dateTime: DateTime): EntityTag = {
    EntityTag(md5Sum(dateTime.toIsoDateTimeString()), weak = true)
  }
}
