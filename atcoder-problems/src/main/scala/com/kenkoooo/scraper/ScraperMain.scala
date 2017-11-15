package com.kenkoooo.scraper

import java.io.File
import java.util.concurrent.Executors

import com.kenkoooo.common.Configure
import com.kenkoooo.db.SqlDataStore
import com.typesafe.config.ConfigFactory.parseFile
import pureconfig.loadConfig

object ScraperMain {
  def main(args: Array[String]): Unit = {
    val config = loadConfig[Configure](parseFile(new File(args(0)))).right.get
    val service = Executors.newScheduledThreadPool(config.scraper.threads)
    val sql =
      new SqlDataStore(url = config.sql.url, user = config.sql.user, password = config.sql.password)

  }
}
