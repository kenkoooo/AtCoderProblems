package com.kenkoooo.atcoder.model

import com.kenkoooo.atcoder.common.TypeAnnotations.{ProblemId, SubmissionId, UserId}
import com.kenkoooo.atcoder.db.SQLSelectInsertSupport
import scalikejdbc._

case class Submission(id: SubmissionId,
                      epochSecond: Long = 0,
                      problemId: ProblemId,
                      userId: UserId,
                      language: String = "",
                      point: Double = 0.0,
                      length: Int = 0,
                      result: String,
                      executionTime: Option[Int] = None)

object Submission extends SQLSelectInsertSupport[Submission] {
  val FirstPageNumber = 1

  override val definedTableName = "submissions"

  override def apply(row: ResultName[Submission])(rs: WrappedResultSet): Submission =
    Submission(
      id = rs.long(row.id),
      epochSecond = rs.long(row.epochSecond),
      problemId = rs.string(row.problemId),
      userId = rs.string(row.userId),
      language = rs.string(row.language),
      point = rs.double(row.point),
      length = rs.int(row.length),
      result = rs.string(row.result),
      executionTime = rs.intOpt(row.executionTime)
    )

  override def createMapping(seq: Seq[Submission]): Seq[Seq[(SQLSyntax, ParameterBinder)]] = {
    val column = Submission.column
    seq.map { submission =>
      Seq(
        column.id -> submission.id,
        column.epochSecond -> submission.epochSecond,
        column.problemId -> submission.problemId,
        column.userId -> submission.userId,
        column.language -> submission.language,
        column.point -> submission.point,
        column.length -> submission.length,
        column.result -> submission.result,
        column.executionTime -> submission.executionTime
      )
    }
  }
}
