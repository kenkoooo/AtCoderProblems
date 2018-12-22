package com.kenkoooo.atcoder.common
import com.kenkoooo.atcoder.common.ReducedRanker._
import org.scalatest.{FunSuite, Matchers}

class ReducedRankerTest extends FunSuite with Matchers {
  test("reduce") {
    val list = List(1.0, 1.0, 2.0, 1.0, 3.0, 1.0)
    val map = list.sorted.reverse.reduceToMap
    map shouldBe Map(1.0 -> 2, 2.0 -> 1, 3.0 -> 0)
  }
}
