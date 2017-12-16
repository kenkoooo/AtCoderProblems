package com.kenkoooo.atcoder.model

import com.kenkoooo.atcoder.common.TypeAnnotations.UserId
import com.kenkoooo.atcoder.db.SQLSelectSupport
import scalikejdbc.WrappedResultSet

case class RatedPointSum(userId: UserId, pointSum: Double)

object RatedPointSum extends SQLSelectSupport[RatedPointSum] {
  override protected def definedTableName: String = "rated_point_sum"

  override def apply(
    resultName: scalikejdbc.ResultName[RatedPointSum]
  )(rs: WrappedResultSet): RatedPointSum =
    RatedPointSum(userId = rs.string(resultName.userId), pointSum = rs.double(resultName.pointSum))
}
