package com.kenkoooo.atcoder.common

import org.scalatest.{FunSuite, Matchers}

class ConfigureTest extends FunSuite with Matchers {
  test("parse JSON Configure") {
    val path = getClass.getClassLoader.getResource("test-conf.json").getPath
    val config = Configure(path).get
    config.scraper.threads shouldBe 11
    config.sql.url shouldBe "sql-url"
    config.server.port shouldBe 9090
  }
}
