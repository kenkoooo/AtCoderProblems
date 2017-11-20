package com.kenkoooo.atcoder.model

import com.kenkoooo.atcoder.common.TypeAnnotations.{ProblemId, SubmissionId}
import com.kenkoooo.atcoder.db.SQLInsertSelectSupport
import scalikejdbc.{ParameterBinder, WrappedResultSet}
import scalikejdbc.interpolation.SQLSyntax

case class Shortest(problemId: ProblemId, submissionId: SubmissionId)

object Shortest extends SQLInsertSelectSupport[Shortest] {
  override def tableName: String = "shortest"

  override def apply(resultName: scalikejdbc.ResultName[Shortest])(rs: WrappedResultSet) =
    Shortest(
      problemId = rs.string(resultName.problemId),
      submissionId = rs.long(resultName.submissionId)
    )

  override def createMapping(seq: Seq[Shortest]): Seq[Seq[(SQLSyntax, ParameterBinder)]] = {
    val column = this.column
    seq.map { shortest =>
      Seq(column.problemId -> shortest.problemId, column.submissionId -> shortest.submissionId)
    }
  }
}
