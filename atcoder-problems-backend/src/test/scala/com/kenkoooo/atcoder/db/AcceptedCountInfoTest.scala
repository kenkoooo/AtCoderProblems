package com.kenkoooo.atcoder.db
import com.kenkoooo.atcoder.model.AcceptedCount
import org.scalatest.{FunSuite, Matchers}

class AcceptedCountInfoTest extends FunSuite with Matchers {
  test("construct") {
    val info = new AcceptedCountInfo(
      List(
        AcceptedCount("user1", 5),
        AcceptedCount("user2", 4),
        AcceptedCount("user3", 4),
        AcceptedCount("user4", 9)
      )
    )
    info.countAndRankOf("user1") shouldBe (5, 1)
    info.countAndRankOf("user2") shouldBe (4, 2)
    info.countAndRankOf("user3") shouldBe (4, 2)
    info.countAndRankOf("user4") shouldBe (9, 0)
    info.countAndRankOf("unknown_user") shouldBe (0, 4)
  }
}
