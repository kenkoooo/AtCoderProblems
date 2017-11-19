package com.kenkoooo.atcoder.common

import java.io.File

import com.typesafe.config.ConfigFactory.parseFile
import pureconfig.loadConfig

import scala.util.Try

case class Configure(scraper: ScraperConfig, sql: SQLConfig, server: ServerConfig)

case class ScraperConfig(threads: Int)

case class SQLConfig(url: String, user: String, password: String)

case class ServerConfig(port: Int)

object Configure {
  def apply(filepath: String): Try[Configure] = Try {
    loadConfig[Configure](parseFile(new File(filepath))).right.get
  }
}
