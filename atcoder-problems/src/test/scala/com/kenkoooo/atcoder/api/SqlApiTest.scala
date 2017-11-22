package com.kenkoooo.atcoder.api

import akka.http.scaladsl.model.DateTime
import akka.http.scaladsl.testkit.ScalatestRouteTest
import com.kenkoooo.atcoder.db.SqlClient
import com.kenkoooo.atcoder.model.{Contest, Problem}
import org.mockito.Mockito
import org.scalatest.mockito.MockitoSugar
import org.scalatest.{FunSuite, Matchers}
import akka.http.scaladsl.model.StatusCodes._
import akka.http.scaladsl.model.headers.EntityTag
import akka.http.scaladsl.model.headers._

class SqlApiTest extends FunSuite with Matchers with ScalatestRouteTest with MockitoSugar {
  val currentTime: Long = System.currentTimeMillis()
  val currentTimeTag: EntityTag = EntityTagger.calculateDateTimeTag(DateTime(currentTime))

  val sql: SqlClient = mock[SqlClient]
  Mockito
    .when(sql.contests)
    .thenReturn(Map("contest-id" -> Contest("contest-id", 0, 0, "contest title", "rate change?")))
  Mockito
    .when(sql.problems)
    .thenReturn(Map("problem-id" -> Problem("problem-id", "contest-id", "problem title")))
  Mockito.when(sql.lastReloadedTimeMillis).thenReturn(currentTime)

  test("return 200 to new request") {
    val api = new SqlApi(sql)
    Get("/info/contests") ~> api.routes ~> check {
      status shouldBe OK
      header("ETag").get.value() shouldBe currentTimeTag.toString()
      responseAs[String] shouldBe """[{"start_epoch_second":0,"rate_change":"rate change?","id":"contest-id","duration_second":0,"title":"contest title"}]"""
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
}
