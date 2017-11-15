package com.kenkoooo.model

import scalikejdbc._

case class Submission(id: Long,
                      epochSecond: Long,
                      problemId: String,
                      userId: String,
                      language: String,
                      point: Long,
                      length: Int,
                      result: String,
                      executionTime: Option[Int])

object Submission extends SQLSyntaxSupport[Submission] {

  override val tableName = "submissions"

  def apply(s: SyntaxProvider[Submission])(rs: WrappedResultSet): Submission =
    apply(s.resultName)(rs)

  def apply(row: ResultName[Submission])(rs: WrappedResultSet): Submission =
    Submission(
      id = rs.long(row.id),
      epochSecond = rs.long(row.epochSecond),
      problemId = rs.string(row.problemId),
      userId = rs.string(row.userId),
      language = rs.string(row.language),
      point = rs.long(row.point),
      length = rs.int(row.length),
      result = rs.string(row.result),
      executionTime = rs.intOpt(row.executionTime)
    )
}
