package com.kenkoooo.model

import com.kenkoooo.db.SQLInsertSelectSupport
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

object Submission extends SQLInsertSelectSupport[Submission] {

  override val tableName = "submissions"

  override def apply(row: ResultName[Submission])(rs: WrappedResultSet): Submission =
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

  override def batchColumnMapping: Seq[(SQLSyntax, ParameterBinder)] = {
    val s = Submission.column
    Seq(
      s.id -> sqls.?,
      s.epochSecond -> sqls.?,
      s.problemId -> sqls.?,
      s.userId -> sqls.?,
      s.language -> sqls.?,
      s.point -> sqls.?,
      s.length -> sqls.?,
      s.result -> sqls.?,
      s.executionTime -> sqls.?
    )
  }

  override def createParams(seq: Seq[Submission]): Seq[Seq[Any]] = {
    seq.map(
      s =>
        Seq(
          s.id,
          s.epochSecond,
          s.problemId,
          s.userId,
          s.language,
          s.point,
          s.length,
          s.result,
          s.executionTime
      )
    )
  }
}
