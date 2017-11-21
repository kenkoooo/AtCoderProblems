package com.kenkoooo.atcoder.model

import com.kenkoooo.atcoder.common.TypeAnnotations.ProblemId
import com.kenkoooo.atcoder.db.SQLInsertSelectSupport
import scalikejdbc.{ParameterBinder, WrappedResultSet}
import scalikejdbc.interpolation.SQLSyntax

case class Solver(problemId: ProblemId, userCount: Int)

object Solver extends SQLInsertSelectSupport[Solver] {
  override def apply(resultName: scalikejdbc.ResultName[Solver])(rs: WrappedResultSet): Solver =
    Solver(problemId = rs.string(resultName.problemId), userCount = rs.int(resultName.userCount))

  override def createMapping(seq: Seq[Solver]): Seq[Seq[(SQLSyntax, ParameterBinder)]] = {
    val column = Solver.column
    seq.map { solver =>
      Seq(column.problemId -> solver.problemId, column.userCount -> solver.userCount)
    }
  }

  override protected def definedTableName = "solver"
}
