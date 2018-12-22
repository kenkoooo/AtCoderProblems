package com.kenkoooo.atcoder.db
import com.kenkoooo.atcoder.model.RatedPointSum
import org.scalatest.{FunSuite, Matchers}

class RatedPointSumInfoTest extends FunSuite with Matchers {
  test("construct") {
    val list =
      List(
        RatedPointSum("user1", 100),
        RatedPointSum("user2", 50),
        RatedPointSum("user3", 50),
        RatedPointSum("user4", 20)
      )
    val info = new RatedPointSumInfo(list)
    info.pointAndRankOf("user1") shouldBe (100.0, 0)
    info.pointAndRankOf("user2") shouldBe (50.0, 1)
    info.pointAndRankOf("user3") shouldBe (50.0, 1)
    info.pointAndRankOf("user4") shouldBe (20.0, 3)
    info.pointAndRankOf("unknown_user") shouldBe (0.0, 4)
  }
}
