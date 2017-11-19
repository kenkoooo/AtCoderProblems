package com.kenkoooo.atcoder.api

import akka.http.scaladsl.model.DateTime
import akka.http.scaladsl.testkit.ScalatestRouteTest
import com.kenkoooo.atcoder.db.SqlClient
import com.kenkoooo.atcoder.model.Contest
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
  Mockito.when(sql.contests).thenReturn(Map[String, Contest]())
  Mockito.when(sql.lastReloadedTimeMillis).thenReturn(currentTime)

  test("return 200 to new request") {
    val api = new SqlApi(sql)
    Get("/contests") ~> api.routes ~> check {
      status shouldBe OK
    }
  }

  test("return 304 to cached request") {
    val api = new SqlApi(sql)
    Get("/contests") ~> addHeader(`If-None-Match`.name, currentTimeTag.toString()) ~> api.routes ~> check {
      status shouldBe NotModified
    }
  }

  test("return 200 to requests with invalid tags") {
    val api = new SqlApi(sql)
    Get("/contests") ~> addHeader(`If-None-Match`.name, """W/"INVALID_TAG"""") ~> api.routes ~> check {
      status shouldBe OK
    }
  }
}
