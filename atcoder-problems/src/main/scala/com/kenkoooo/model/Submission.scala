package com.kenkoooo.model

import scalikejdbc._

case class Submission(id: Long,
                      epochSecond: Long,
                      problemId: String,
                      user: String,
                      language: String,
                      point: Long,
                      length: Int,
                      result: String,
                      executionTime: Option[Int])

object Submission extends SQLSyntaxSupport[Submission] {

  override val tableName = "submissions"

  def apply(row: ResultName[Submission])(rs: WrappedResultSet) =
    new Submission(
      id = rs.long(row.c("id")),
      epochSecond = rs.long(row.c("epoch_second")),
      problemId = rs.string(row.c("problem_id")),
      user = rs.string(row.c("user_id")),
      language = rs.string(row.c("language")),
      point = rs.long(row.c("point")),
      length = rs.int(row.c("length")),
      result = rs.string(row.c("result")),
      executionTime = rs.intOpt(row.c("execution_time"))
    )
}
