package com.kenkoooo.atcoder.api

import akka.http.scaladsl.model.DateTime
import akka.http.scaladsl.model.StatusCodes._
import akka.http.scaladsl.model.headers.{EntityTag, _}
import akka.http.scaladsl.testkit.ScalatestRouteTest
import com.kenkoooo.atcoder.db.SqlClient
import com.kenkoooo.atcoder.model._
import org.mockito.ArgumentMatchers
import org.mockito.Mockito.{times, verify, when}
import org.scalatest.mockito.MockitoSugar
import org.scalatest.{BeforeAndAfter, FunSuite, Matchers}

class JsonApiTest
    extends FunSuite
    with Matchers
    with ScalatestRouteTest
    with MockitoSugar
    with BeforeAndAfter {
  val currentTime: Long = System.currentTimeMillis()
  val currentTimeTag: EntityTag = EntityTagger.calculateDateTimeTag(DateTime(currentTime))

  private var sql: SqlClient = mock[SqlClient]

  before {
    sql = mock[SqlClient]
    when(sql.loadContest())
      .thenReturn(List(Contest("contest-id", 114, 514, "contest title", "rate change?")))
    when(sql.problems)
      .thenReturn(Map("problem-id" -> Problem("problem-id", "contest-id", "problem title")))
    when(sql.lastReloadedTimeMillis).thenReturn(currentTime)
    when(sql.shortestSubmissionCounts).thenReturn(List(ShortestSubmissionCount("kenkoooo", 114)))
    when(sql.fastestSubmissionCounts).thenReturn(List(FastestSubmissionCount("kenkoooo", 114)))
    when(sql.firstSubmissionCounts).thenReturn(List(FirstSubmissionCount("kenkoooo", 114)))
    when(sql.acceptedCounts).thenReturn(List(AcceptedCount("kenkoooo", 114)))
    when(sql.loadUserSubmissionCount(ArgumentMatchers.any())).thenReturn(1)
    when(sql.loadUserSubmissions(ArgumentMatchers.any())).thenReturn(
      Iterator(
        Submission(
          id = 114,
          epochSecond = 514,
          problemId = "problem_id",
          userId = "user-id",
          language = "Lang",
          point = 89.3,
          length = 810,
          result = "AC",
          contestId = "contest-id",
          executionTime = None
        )
      )
    )
    when(sql.mergedProblems).thenReturn(
      List(
        MergedProblem(
          "problem1",
          "contest2",
          "title3",
          Some(4),
          Some("faster"),
          Some("faster"),
          Some(5),
          Some(6),
          Some("first"),
          Some("faster"),
          Some(7),
          Some("short"),
          Some("faster"),
          Some(8),
          9,
          Some(10.0),
          Some(11.0)
        )
      )
    )
    when(sql.ratedPointSums)
      .thenReturn(List(RatedPointSum("user1", 100.0), RatedPointSum("user2", 200.0)))
    when(sql.languageCounts)
      .thenReturn(List(LanguageCount("user1", "Rust", 100), LanguageCount("user2", "Java", 200)))
    when(sql.predictedRatings).thenReturn(List(PredictedRating("kenkoooo", 3.14)))
    when(sql.pointAndRankOf("kenkoooo")).thenReturn((1.0, 2))
    when(sql.countAndRankOf("kenkoooo")).thenReturn((3, 4))
  }

  test("return 200 to new request") {
    val api = new JsonApi(sql)
    Get("/info/contests") ~> api.routes ~> check {
      status shouldBe OK
      header("ETag").get.value() shouldBe currentTimeTag.toString()
      responseAs[String] shouldBe """[{"start_epoch_second":114,"rate_change":"rate change?","id":"contest-id","duration_second":514,"title":"contest title"}]"""
    }
  }

  test("check CORS header") {
    val api = new JsonApi(sql)
    Get("/info/contests") ~> api.routes ~> check {
      status shouldBe OK
      header("Access-Control-Allow-Origin").get.value() shouldBe "*"
    }
  }

  test("return 304 to cached request") {
    val api = new JsonApi(sql)
    Get("/info/contests") ~> addHeader(`If-None-Match`.name, currentTimeTag.toString()) ~> api.routes ~> check {
      status shouldBe NotModified
      header("ETag").get.value() shouldBe currentTimeTag.toString()
    }
  }

  test("return 200 to requests with invalid tags") {
    val api = new JsonApi(sql)
    Get("/info/contests") ~> addHeader(`If-None-Match`.name, """W/"INVALID_TAG"""") ~> api.routes ~> check {
      status shouldBe OK
      header("ETag").get.value() shouldBe currentTimeTag.toString()
    }
  }

  test("return 200 to problems request") {
    val api = new JsonApi(sql)
    Get("/info/problems") ~> api.routes ~> check {
      status shouldBe OK
      responseAs[String] shouldBe """[{"id":"problem-id","contest_id":"contest-id","title":"problem title"}]"""
    }
  }

  test("user-count APIs") {
    val api = new JsonApi(sql)
    val expectedResponse = """[{"user_id":"kenkoooo","problem_count":114}]"""

    Get("/info/ac") ~> api.routes ~> check {
      status shouldBe OK
      responseAs[String] shouldBe expectedResponse
    }
    Get("/info/first") ~> api.routes ~> check {
      status shouldBe OK
      responseAs[String] shouldBe expectedResponse
    }
    Get("/info/fast") ~> api.routes ~> check {
      status shouldBe OK
      responseAs[String] shouldBe expectedResponse
    }
    Get("/info/short") ~> api.routes ~> check {
      status shouldBe OK
      responseAs[String] shouldBe expectedResponse
    }
  }

  test("user submission result api") {
    val api = new JsonApi(sql)

    Get("/results") ~> api.routes ~> check {
      status shouldBe OK
      responseAs[String] shouldBe """[{"point":89.3,"result":"AC","problem_id":"problem_id","user_id":"user-id","epoch_second":514,"contest_id":"contest-id","id":114,"language":"Lang","length":810}]"""
      verify(sql, times(1)).loadUserSubmissions()
    }
  }

  test("submission api with user") {
    val api = new JsonApi(sql)

    Get("/results?user=kenkoooo") ~> api.routes ~> check {
      status shouldBe OK
      verify(sql, times(1)).loadUserSubmissions("kenkoooo")
    }
  }

  test("submission api with user and a rival") {
    val api = new JsonApi(sql)

    Get("/results?user=kenkoooo&rivals=chokudai") ~> api.routes ~> check {
      status shouldBe OK
      verify(sql, times(1)).loadUserSubmissions("kenkoooo", "chokudai")
    }
  }

  test("submission api with user and rivals") {
    val api = new JsonApi(sql)

    Get("/results?user=kenkoooo&rivals=chokudai,iwiwi") ~> api.routes ~> check {
      status shouldBe OK
      verify(sql, times(1)).loadUserSubmissions("kenkoooo", "chokudai", "iwiwi")
    }
  }

  test("filter invalid parameters") {
    val api = new JsonApi(sql)

    Get("/results?user=kenk;oooo&rivals=cho$udai,iwi@wi") ~> api.routes ~> check {
      status shouldBe OK
      verify(sql, times(1)).loadUserSubmissions()
    }
  }

  test("merged problems api") {
    val api = new JsonApi(sql)
    val expectedJson =
      """[{"first_submission_id":6,"solver_count":9,"fastest_user_id":"faster","execution_time":5,"point":10.0,"shortest_user_id":"short","first_contest_id":"faster","shortest_submission_id":7,"fastest_contest_id":"faster","contest_id":"contest2","id":"problem1","fastest_submission_id":4,"shortest_contest_id":"faster","first_user_id":"first","predict":11.0,"title":"title3","source_code_length":8}]"""
    Get("/info/merged-problems") ~> api.routes ~> check {
      status shouldBe OK
      responseAs[String] shouldBe expectedJson
    }
  }

  test("rated point sums api") {
    val api = new JsonApi(sql)
    val expectedJson =
      """[{"user_id":"user1","point_sum":100.0},{"user_id":"user2","point_sum":200.0}]"""
    Get("/info/sums") ~> api.routes ~> check {
      status shouldBe OK
      responseAs[String] shouldBe expectedJson
    }
  }

  test("language count api") {
    val api = new JsonApi(sql)
    val expectedJson =
      """[{"user_id":"user1","language":"Rust","count":100},{"user_id":"user2","language":"Java","count":200}]"""
    Get("/info/lang") ~> api.routes ~> check {
      status shouldBe OK
      responseAs[String] shouldBe expectedJson
    }
  }

  test("predicted rating api") {
    val api = new JsonApi(sql)
    Get("/info/predicted-ratings") ~> api.routes ~> check {
      status shouldBe OK
      responseAs[String] shouldBe """[{"user_id":"kenkoooo","rating":3.14}]"""
    }
  }

  test("user info API") {
    val api = new JsonApi(sql)

    Get("/v2/user_info?user=kenkoooo") ~> api.routes ~> check {
      status shouldBe OK
      responseAs[String] shouldBe """{"accepted_count_rank":4,"rated_point_sum_rank":2,"rated_point_sum":1.0,"user_id":"kenkoooo","accepted_count":3}"""
    }
  }
}
