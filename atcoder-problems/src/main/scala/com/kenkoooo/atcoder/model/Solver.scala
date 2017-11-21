package com.kenkoooo.atcoder.model

import com.kenkoooo.atcoder.common.TypeAnnotations.ProblemId
import com.kenkoooo.atcoder.db.SQLSelectSupport
import scalikejdbc.WrappedResultSet

case class Solver(problemId: ProblemId, userCount: Int)

object Solver extends SQLSelectSupport[Solver] {
  override def apply(resultName: scalikejdbc.ResultName[Solver])(rs: WrappedResultSet): Solver =
    Solver(problemId = rs.string(resultName.problemId), userCount = rs.int(resultName.userCount))

  override protected def definedTableName = "solver"
}
