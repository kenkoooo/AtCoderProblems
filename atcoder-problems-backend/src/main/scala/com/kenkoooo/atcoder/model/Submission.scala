package com.kenkoooo.atcoder.model

import com.kenkoooo.atcoder.common.TypeAnnotations.{ContestId, ProblemId, SubmissionId, UserId}
import com.kenkoooo.atcoder.db.{Mapping, SQLSelectInsertSupport}
import scalikejdbc._

case class Submission(id: SubmissionId,
                      epochSecond: Long = 0,
                      problemId: ProblemId,
                      userId: UserId,
                      language: String = "",
                      point: Double = 0.0,
                      length: Int = 0,
                      result: String,
                      contestId: ContestId = "",
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
      contestId = rs.string(row.contestId),
      executionTime = rs.intOpt(row.executionTime)
    )

  override def createMapping(seq: Seq[Submission]): Mapping = {
    val column = Submission.column
    val mapping = seq.map { submission =>
      Seq(
        column.epochSecond -> submission.epochSecond,
        column.problemId -> submission.problemId,
        column.userId -> submission.userId,
        column.language -> submission.language,
        column.point -> submission.point,
        column.length -> submission.length,
        column.result -> submission.result,
        column.contestId -> submission.contestId,
        column.executionTime -> submission.executionTime
      )
    }
    val key = seq.map(column.id -> _.id)
    Mapping(key, mapping)
  }
}
