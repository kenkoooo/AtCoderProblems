package com.kenkoooo.atcoder

import java.util.concurrent.{Executors, TimeUnit}

import com.kenkoooo.atcoder.common.Configure
import com.kenkoooo.atcoder.db.SqlClient
import org.apache.logging.log4j.scala.Logging

import scala.util.{Failure, Success}

object StatisticsBatchMain extends App with Logging {
  Configure(args(0)) match {
    case Success(conf) =>
      val sql =
        new SqlClient(url = conf.sql.url, user = conf.sql.user, password = conf.sql.password)
      val executor = Executors.newSingleThreadScheduledExecutor
      executor.scheduleAtFixedRate(() => {
        logger.info("start batch table update")
        sql.batchUpdateStatisticTables()
        logger.info("finished batch table update")
      }, 0, 5, TimeUnit.MINUTES)
    case Failure(e) => logger.catching(e)
  }
}
