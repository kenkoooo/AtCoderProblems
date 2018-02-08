package com.kenkoooo.atcoder.model

import com.kenkoooo.atcoder.common.TypeAnnotations.UserId
import com.kenkoooo.atcoder.db.SQLSelectSupport
import scalikejdbc.WrappedResultSet

case class PredictedRating(userId: UserId, rating: Double)

object PredictedRating extends SQLSelectSupport[PredictedRating] {
  override protected def definedTableName: String = "predicted_rating"

  override def apply(
    resultName: scalikejdbc.ResultName[PredictedRating]
  )(rs: WrappedResultSet): PredictedRating =
    PredictedRating(userId = rs.string(resultName.userId), rating = rs.double(resultName.rating))
}
