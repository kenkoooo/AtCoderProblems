package com.kenkoooo.atcoder

import com.kenkoooo.atcoder.common.Configure
import com.kenkoooo.atcoder.db.SqlClient

import scala.util.{Failure, Success}

object TestMain extends App {
  Configure(args(0)) match {
    case Success(config) =>
      val sql = new SqlClient(config.sql.url, config.sql.user, config.sql.password)
      println(sql.experiment.size)
      Thread.sleep(10000)
    case Failure(_) =>
  }
}
