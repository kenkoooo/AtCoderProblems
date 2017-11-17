package com.kenkoooo.scraper

import java.io.File
import java.util.concurrent.Executors

import com.kenkoooo.common.Configure
import com.kenkoooo.db.SqlDataStore
import com.typesafe.config.ConfigFactory.parseFile
import org.apache.logging.log4j.scala.Logging
import pureconfig.loadConfig

object ScraperMain extends Logging {
  def main(args: Array[String]): Unit = {
    loadConfig[Configure](parseFile(new File(args(0)))) match {
      case Right(config) =>
        val service = Executors.newScheduledThreadPool(config.scraper.threads)
        val sql =
          new SqlDataStore(
            url = config.sql.url,
            user = config.sql.user,
            password = config.sql.password
          )

      case Left(e) => e.toList.foreach(f => logger.error(f.description))
    }

  }
}
