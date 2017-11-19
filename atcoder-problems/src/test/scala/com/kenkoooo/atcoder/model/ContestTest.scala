package com.kenkoooo.atcoder.model

import com.kenkoooo.atcoder.model.ContestJsonProtocol.format
import org.scalatest.{FunSuite, Matchers}
import spray.json._

class ContestTest extends FunSuite with Matchers {
  test("convert to json") {
    val contest = Contest("arc999", 114514, 810893, "AtCoder R18 Contest 999", " x ")
    val expectedJsonString =
      """{
        |  "start_epoch_second": 114514,
        |  "rate_change": " x ",
        |  "id": "arc999",
        |  "duration_second": 810893,
        |  "title": "AtCoder R18 Contest 999"
        |}""".stripMargin
    contest.toJson.prettyPrint shouldBe expectedJsonString
  }
}
