package com.kenkoooo.atcoder

import com.kenkoooo.atcoder.common.Configure
import com.kenkoooo.atcoder.db.SqlClient

import scala.util.{Failure, Success}

object TestMain {
  def main(args: Array[String]): Unit = {
    Configure(args(0)) match {
      case Success(config) =>
        val sql = new SqlClient(config.sql.url, config.sql.user, config.sql.password)
        sql.experiment()
      case Failure(_) =>
    }
  }
}
