package com.kenkoooo.atcoder.model

import com.kenkoooo.atcoder.common.TypeAnnotations.{ProblemId, SubmissionId}
import com.kenkoooo.atcoder.db.SQLInsertSelectSupport
import scalikejdbc.{ParameterBinder, WrappedResultSet}
import scalikejdbc.interpolation.SQLSyntax

trait ProblemSubmissionPair {
  def problemId: ProblemId

  def submissionId: SubmissionId
}

trait ProblemSubmissionPairSupport[T <: ProblemSubmissionPair] extends SQLInsertSelectSupport[T] {
  override def apply(resultName: scalikejdbc.ResultName[T])(rs: WrappedResultSet): T =
    apply(
      problemId = rs.string(resultName.problemId),
      submissionId = rs.long(resultName.submissionId)
    )

  def apply(problemId: ProblemId, submissionId: SubmissionId): T

  override def createMapping(seq: Seq[T]): Seq[Seq[(SQLSyntax, ParameterBinder)]] = {
    val column = this.column
    seq.map { t =>
      Seq(column.problemId -> t.problemId, column.submissionId -> t.submissionId)
    }
  }
}

case class Shortest(problemId: ProblemId, submissionId: SubmissionId) extends ProblemSubmissionPair

object Shortest extends ProblemSubmissionPairSupport[Shortest] {
  override def definedTableName: String = "shortest"
}

case class Fastest(problemId: ProblemId, submissionId: SubmissionId) extends ProblemSubmissionPair

object Fastest extends ProblemSubmissionPairSupport[Fastest] {
  override protected def definedTableName = "fastest"
}
