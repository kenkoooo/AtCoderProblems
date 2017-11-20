package com.kenkoooo.atcoder.model

import com.kenkoooo.atcoder.db.SQLInsertSelectSupport
import scalikejdbc.{ParameterBinder, WrappedResultSet}
import scalikejdbc.interpolation.SQLSyntax

case class Solver(problemId: String, solvers: Int)
object Solver extends SQLInsertSelectSupport[Solver] {
  override val tableName = "solvers"

  override def apply(resultName: scalikejdbc.ResultName[Solver])(rs: WrappedResultSet): Solver =
    Solver(problemId = rs.string(resultName.problemId), solvers = rs.int(resultName.solvers))

  override def createMapping(seq: Seq[Solver]): Seq[Seq[(SQLSyntax, ParameterBinder)]] = {
    val column = Solver.column
    seq.map { solver =>
      Seq(column.problemId -> solver.problemId, column.solvers -> solver.solvers)
    }
  }
}
