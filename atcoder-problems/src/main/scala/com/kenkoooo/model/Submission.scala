package com.kenkoooo.model

import com.kenkoooo.db.Insertable
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

object Submission extends Insertable[Submission] {

  override val tableName = "submissions"

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

  override def columnMapping(submission: Submission): Seq[(SQLSyntax, ParameterBinder)] = {
    val s = Submission.column
    Seq(
      s.id -> submission.id,
      s.epochSecond -> submission.epochSecond,
      s.problemId -> submission.problemId,
      s.userId -> submission.userId,
      s.language -> submission.language,
      s.point -> submission.point,
      s.length -> submission.length,
      s.result -> submission.result,
      s.executionTime -> submission.executionTime
    )
  }

}
