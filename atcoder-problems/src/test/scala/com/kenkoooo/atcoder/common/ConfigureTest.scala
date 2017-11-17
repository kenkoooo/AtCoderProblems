package com.kenkoooo.atcoder.common

import org.scalatest.{FunSuite, Matchers}
import pureconfig.loadConfig

import scala.io.Source
import com.typesafe.config.ConfigFactory.parseString

class ConfigureTest extends FunSuite with Matchers {
  test("parse JSON Configure") {
    val config = loadConfig[Configure](parseString(Source.fromResource("test-conf.json").mkString))
    config.right.get.scraper.threads shouldBe 11
    config.right.get.sql.url shouldBe "sql-url"
  }
}
