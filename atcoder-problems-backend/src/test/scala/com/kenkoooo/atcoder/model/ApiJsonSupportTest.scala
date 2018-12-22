package com.kenkoooo.atcoder.model

import org.scalatest.{FunSuite, Matchers}
import spray.json._

class ApiJsonSupportTest extends FunSuite with Matchers with ApiJsonSupport {
  test("convert contest to json") {
    Contest("id", 114, 514, "arc999", "rate change?").toJson.prettyPrint shouldBe
      """{
        |  "start_epoch_second": 114,
        |  "rate_change": "rate change?",
        |  "id": "id",
        |  "duration_second": 514,
        |  "title": "arc999"
        |}""".stripMargin
  }

  test("convert submission to json") {
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
    ).toJson.prettyPrint shouldBe
      """{
        |  "execution_time": 893,
        |  "point": 3.14,
        |  "result": "AC",
        |  "problem_id": "arc000_a",
        |  "user_id": "kenkoooo",
        |  "epoch_second": 514,
        |  "contest_id": "",
        |  "id": 114,
        |  "language": "Rust 1.21",
        |  "length": 810
        |}""".stripMargin
  }

  test("convert submission with a blank field to json") {
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
    ).toJson.prettyPrint shouldBe
      """{
        |  "point": 3.14,
        |  "result": "AC",
        |  "problem_id": "arc000_a",
        |  "user_id": "kenkoooo",
        |  "epoch_second": 514,
        |  "contest_id": "",
        |  "id": 114,
        |  "language": "Rust 1.21",
        |  "length": 810
        |}""".stripMargin
  }

  test("convert problem to json") {
    Problem(id = "arc000_a", contestId = "arc000", title = "A - B problem").toJson.prettyPrint shouldBe
      """{
        |  "id": "arc000_a",
        |  "contest_id": "arc000",
        |  "title": "A - B problem"
        |}""".stripMargin
  }

  test("convert user-count pairs to json") {
    val expectedJson = """{"user_id":"kenkoooo","problem_count":114}"""

    FirstSubmissionCount("kenkoooo", 114).toJson.toString() shouldBe expectedJson
    FastestSubmissionCount("kenkoooo", 114).toJson.toString() shouldBe expectedJson
    ShortestSubmissionCount("kenkoooo", 114).toJson.toString() shouldBe expectedJson
    AcceptedCount("kenkoooo", 114).toJson.toString() shouldBe expectedJson
  }

  test("convert merged problems") {
    MergedProblem(
      id = "problem_id",
      fastestSubmissionId = Some(1),
      fastestUserId = Some("fastest"),
      fastestContestId = Some("fastest_contest"),
      executionTime = Some(2),
      firstSubmissionId = Some(3),
      firstUserId = Some("first"),
      firstContestId = Some("first_contest"),
      shortestSubmissionId = Some(4),
      shortestUserId = Some("shortest"),
      shortestContestId = Some("shortest_contest"),
      sourceCodeLength = Some(5),
      contestId = "contest",
      title = "title",
      solverCount = 6,
      point = Some(7.0),
      predict = Some(8.0)
    ).toJson.prettyPrint shouldBe
      """{
        |  "first_submission_id": 3,
        |  "solver_count": 6,
        |  "fastest_user_id": "fastest",
        |  "execution_time": 2,
        |  "point": 7.0,
        |  "shortest_user_id": "shortest",
        |  "first_contest_id": "first_contest",
        |  "shortest_submission_id": 4,
        |  "fastest_contest_id": "fastest_contest",
        |  "contest_id": "contest",
        |  "id": "problem_id",
        |  "fastest_submission_id": 1,
        |  "shortest_contest_id": "shortest_contest",
        |  "first_user_id": "first",
        |  "predict": 8.0,
        |  "title": "title",
        |  "source_code_length": 5
        |}""".stripMargin
  }

  test("convert user info to json") {
    UserInfo("kenkoooo", 114, 514, 810.0, 893).toJson.prettyPrint shouldBe
      """{
        |  "accepted_count_rank": 514,
        |  "rated_point_sum_rank": 893,
        |  "rated_point_sum": 810.0,
        |  "user_id": "kenkoooo",
        |  "accepted_count": 114
        |}""".stripMargin
  }
}
