package com.kenkoooo.atcoder.model
import com.kenkoooo.atcoder.common.TypeAnnotations.UserId

case class UserInfo(userId: UserId,
                    acceptedCount: Int,
                    acceptedCountRank: Int,
                    ratedPointSum: Double,
                    ratedPointSumRank: Int)
