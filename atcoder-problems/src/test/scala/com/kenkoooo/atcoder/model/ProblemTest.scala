package com.kenkoooo.atcoder.model

import org.scalatest.{FunSuite, Matchers}
import spray.json._

class ProblemTest extends FunSuite with Matchers with ProblemJsonSupport {
  test("convert to json") {
    val problem =
      Problem(id = "arc999_e", contestId = "arc999", title = "AtCoder Rotten Contest 999")
    val expectedJson =
      """{
        |  "id": "arc999_e",
        |  "contest_id": "arc999",
        |  "title": "AtCoder Rotten Contest 999"
        |}""".stripMargin
    problem.toJson.prettyPrint shouldBe expectedJson
  }
}
