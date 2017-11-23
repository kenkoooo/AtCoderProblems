package com.kenkoooo.atcoder.api

import akka.http.scaladsl.model.DateTime
import akka.http.scaladsl.model.StatusCodes._
import akka.http.scaladsl.model.headers.{EntityTag, _}
import akka.http.scaladsl.testkit.ScalatestRouteTest
import com.kenkoooo.atcoder.db.SqlClient
import com.kenkoooo.atcoder.model._
import org.mockito.Mockito.when
import org.scalatest.mockito.MockitoSugar
import org.scalatest.{FunSuite, Matchers}

class SqlApiTest extends FunSuite with Matchers with ScalatestRouteTest with MockitoSugar {
  val currentTime: Long = System.currentTimeMillis()
  val currentTimeTag: EntityTag = EntityTagger.calculateDateTimeTag(DateTime(currentTime))

  val sql: SqlClient = mock[SqlClient]
  when(sql.contests)
    .thenReturn(
      Map("contest-id" -> Contest("contest-id", 114, 514, "contest title", "rate change?"))
    )
  when(sql.problems)
    .thenReturn(Map("problem-id" -> Problem("problem-id", "contest-id", "problem title")))
  when(sql.lastReloadedTimeMillis).thenReturn(currentTime)
  when(sql.shortestSubmissionCounts).thenReturn(List(ShortestSubmissionCount("kenkoooo", 114)))
  when(sql.fastestSubmissionCounts).thenReturn(List(FastestSubmissionCount("kenkoooo", 114)))
  when(sql.firstSubmissionCounts).thenReturn(List(FirstSubmissionCount("kenkoooo", 114)))
  when(sql.acceptedCounts).thenReturn(List(AcceptedCount("kenkoooo", 114)))

  test("return 200 to new request") {
    val api = new SqlApi(sql)
    Get("/info/contests") ~> api.routes ~> check {
      status shouldBe OK
      header("ETag").get.value() shouldBe currentTimeTag.toString()
      responseAs[String] shouldBe """[{"start_epoch_second":114,"rate_change":"rate change?","id":"contest-id","duration_second":514,"title":"contest title"}]"""
    }
  }

  test("return 304 to cached request") {
    val api = new SqlApi(sql)
    Get("/info/contests") ~> addHeader(`If-None-Match`.name, currentTimeTag.toString()) ~> api.routes ~> check {
      status shouldBe NotModified
      header("ETag").get.value() shouldBe currentTimeTag.toString()
    }
  }

  test("return 200 to requests with invalid tags") {
    val api = new SqlApi(sql)
    Get("/info/contests") ~> addHeader(`If-None-Match`.name, """W/"INVALID_TAG"""") ~> api.routes ~> check {
      status shouldBe OK
      header("ETag").get.value() shouldBe currentTimeTag.toString()
    }
  }

  test("return 200 to problems request") {
    val api = new SqlApi(sql)
    Get("/info/problems") ~> api.routes ~> check {
      status shouldBe OK
      responseAs[String] shouldBe """[{"id":"problem-id","contest_id":"contest-id","title":"problem title"}]"""
    }
  }

  test("user-count APIs") {
    val api = new SqlApi(sql)
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
}
