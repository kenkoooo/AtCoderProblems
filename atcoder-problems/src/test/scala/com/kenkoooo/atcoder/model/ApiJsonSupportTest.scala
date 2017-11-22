package com.kenkoooo.atcoder.model

import org.scalatest.{FunSuite, Matchers}
import spray.json._

class ApiJsonSupportTest extends FunSuite with Matchers with ApiJsonSupport {
  test("convert contest to json") {
    val contest = Contest("id", 114, 514, "arc999", "rate change?")
    contest.toJson.prettyPrint shouldBe
      """{
        |  "start_epoch_second": 114,
        |  "rate_change": "rate change?",
        |  "id": "id",
        |  "duration_second": 514,
        |  "title": "arc999"
        |}""".stripMargin
  }

  test("convert submission to json") {
    val submission =
      Submission(
        id = 114,
        epochSecond = 514,
        problemId = "arc000_a",
        userId = "kenkoooo",
        language = "Rust 1.21",
        point = 3.14,
        length = 810,
        result = "AC",
        executionTime = Some(893)
      )
    submission.toJson.prettyPrint shouldBe
      """{
        |  "execution_time": 893,
        |  "point": 3.14,
        |  "result": "AC",
        |  "problem_id": "arc000_a",
        |  "user_id": "kenkoooo",
        |  "epoch_second": 514,
        |  "id": 114,
        |  "language": "Rust 1.21",
        |  "length": 810
        |}""".stripMargin
  }

  test("convert submission with a blank field to json") {
    val submission =
      Submission(
        id = 114,
        epochSecond = 514,
        problemId = "arc000_a",
        userId = "kenkoooo",
        language = "Rust 1.21",
        point = 3.14,
        length = 810,
        result = "AC",
        executionTime = None
      )
    submission.toJson.prettyPrint shouldBe
      """{
        |  "point": 3.14,
        |  "result": "AC",
        |  "problem_id": "arc000_a",
        |  "user_id": "kenkoooo",
        |  "epoch_second": 514,
        |  "id": 114,
        |  "language": "Rust 1.21",
        |  "length": 810
        |}""".stripMargin
  }

  test("convert problem to json") {
    val problem =
      Problem(id = "arc000_a", contestId = "arc000", title = "A - B problem")
    problem.toJson.prettyPrint shouldBe
      """{
        |  "id": "arc000_a",
        |  "contest_id": "arc000",
        |  "title": "A - B problem"
        |}""".stripMargin
  }
}
