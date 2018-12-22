package com.kenkoooo.atcoder.db
import com.kenkoooo.atcoder.common.TypeAnnotations.UserId
import com.kenkoooo.atcoder.common.ReducedRanker._
import com.kenkoooo.atcoder.model.RatedPointSum

class RatedPointSumInfo(val list: List[RatedPointSum]) {
  private val pointMap: Map[UserId, Double] = list.map(sum => sum.userId -> sum.pointSum).toMap
  private val pointRank = list.map(_.pointSum).sorted.reverse.reduceToMap

  def pointAndRankOf(userId: UserId): (Double, Int) = {
    val point = pointMap.getOrElse(userId, RatedPointSumInfo.MINIMUM_POINT)
    val rank = pointRank.getOrElse(point, list.size)
    (point, rank)
  }
}

object RatedPointSumInfo {
  private val MINIMUM_POINT = 0.0
}
