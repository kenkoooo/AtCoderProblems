package com.kenkoooo.atcoder.model

import com.kenkoooo.atcoder.common.TypeAnnotations.ProblemId
import com.kenkoooo.atcoder.db.SQLSelectSupport
import scalikejdbc.WrappedResultSet

case class Point(problemId: ProblemId, point: Option[Double], predict: Option[Double])

object Point extends SQLSelectSupport[Point] {
  override def apply(resultName: scalikejdbc.ResultName[Point])(rs: WrappedResultSet): Point = {
    Point(
      problemId = rs.string(resultName.problemId),
      point = rs.doubleOpt(resultName.point),
      predict = rs.doubleOpt(resultName.predict)
    )
  }

  override protected def definedTableName = "points"
}
