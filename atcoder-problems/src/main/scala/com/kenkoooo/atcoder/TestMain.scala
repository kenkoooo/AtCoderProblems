package com.kenkoooo.atcoder

import com.kenkoooo.atcoder.common.Configure
import com.kenkoooo.atcoder.db.{SqlClient, SubmissionIterator}
import com.kenkoooo.atcoder.model.Submission
import scalikejdbc._
object TestMain extends App {
  val config = Configure(args(0)).get
  val sql = new SqlClient(config.sql.url, config.sql.user, config.sql.password)

  val s = Submission.syntax("s")
  var count = 0
  SubmissionIterator(sql, selectFrom(Submission as s)).foreach { s =>
    count += 1
  }
  println(count)
}
