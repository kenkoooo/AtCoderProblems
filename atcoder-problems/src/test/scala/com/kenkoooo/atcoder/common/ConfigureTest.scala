package com.kenkoooo.atcoder.common

import org.scalatest.{FunSuite, Matchers}
import pureconfig.loadConfig

import scala.io.Source
import com.typesafe.config.ConfigFactory.parseString

class ConfigureTest extends FunSuite with Matchers {
  test("parse JSON Configure") {
    val config =
      loadConfig[Configure](parseString(Source.fromResource("test-conf.json").mkString)).right.get
    config.scraper.threads shouldBe 11
    config.sql.url shouldBe "sql-url"
    config.server.port shouldBe 9090
  }
}
