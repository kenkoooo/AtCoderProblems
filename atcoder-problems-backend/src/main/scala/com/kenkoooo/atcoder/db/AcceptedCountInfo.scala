package com.kenkoooo.atcoder.db
import com.kenkoooo.atcoder.common.TypeAnnotations.UserId
import com.kenkoooo.atcoder.common.ReducedRanker._
import com.kenkoooo.atcoder.model.AcceptedCount

class AcceptedCountInfo(val list: List[AcceptedCount]) {
  private val countMap: Map[UserId, Int] =
    list.map(count => count.userId -> count.problemCount).toMap
  private val countRank = list.map(_.problemCount).sorted.reverse.reduceToMap

  def countAndRankOf(userId: UserId): (Int, Int) = {
    val count = countMap.getOrElse(userId, AcceptedCountInfo.MINIMUM_COUNT)
    val rank = countRank.getOrElse(count, list.size)
    (count, rank)
  }
}

object AcceptedCountInfo {
  private val MINIMUM_COUNT = 0
}
