package com.kenkoooo.atcoder.model

import com.kenkoooo.atcoder.common.TypeAnnotations.ProblemId
import com.kenkoooo.atcoder.db.SQLSelectSupport
import scalikejdbc.WrappedResultSet

case class ProblemSolver(problemId: ProblemId, userCount: Int)

object ProblemSolver extends SQLSelectSupport[ProblemSolver] {
  override def apply(
    resultName: scalikejdbc.ResultName[ProblemSolver]
  )(rs: WrappedResultSet): ProblemSolver =
    ProblemSolver(
      problemId = rs.string(resultName.problemId),
      userCount = rs.int(resultName.userCount)
    )

  override protected def definedTableName = "solver"
}
