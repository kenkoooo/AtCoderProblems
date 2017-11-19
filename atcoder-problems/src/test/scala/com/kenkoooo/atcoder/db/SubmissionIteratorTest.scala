package com.kenkoooo.atcoder.db

import com.kenkoooo.atcoder.model.Submission
import org.mockito.{ArgumentMatchers, Mockito}
import org.scalatest.mockito.MockitoSugar
import org.scalatest.{BeforeAndAfter, FunSuite, Matchers}
import scalikejdbc._

import scala.io.Source

class SubmissionIteratorTest extends FunSuite with Matchers with MockitoSugar with BeforeAndAfter {
  val driver = "org.h2.Driver"
  val url = "jdbc:h2:mem:Test;mode=MySQL;DB_CLOSE_DELAY=-1"
  val sqlUser = "user"
  val sqlPass = "pass"

  Class.forName(driver)
  ConnectionPool.singleton(url, sqlUser, sqlPass)

  before {
    // initialize the test database
    DB.localTx { implicit session =>
      sql"DROP ALL OBJECTS".execute().apply()
      SQL(Source.fromResource("test-db.sql").mkString)
        .execute()
        .apply()
    }
  }

  test("load all submissions") {
    val s = Submission.syntax("s")
    val limit = 2

    val submission1 = mock[Submission]
    Mockito.when(submission1.id).thenReturn(1)
    val submission2 = mock[Submission]
    Mockito.when(submission2.id).thenReturn(2)
    val submission3 = mock[Submission]
    Mockito.when(submission3.id).thenReturn(3)
    val sql = mock[SqlClient]
    Mockito
      .when(sql.executeAndLoadSubmission(ArgumentMatchers.any()))
      .thenAnswer(invocation => {
        val query = invocation.getArgument[SQLBuilder[_]](0)
        if (query.toSQLSyntax.value.contains("offset 0")) {
          List(submission1, submission2)
        } else if (query.toSQLSyntax.value.contains("offset 2")) {
          List(submission3)
        } else {
          List()
        }
      })

    val iterator = SubmissionIterator(sql, select.from(Submission as s), limit)

    iterator.hasNext shouldBe true
    iterator.next().id shouldBe 1
    iterator.hasNext shouldBe true
    iterator.next().id shouldBe 2
    iterator.hasNext shouldBe true
    iterator.next().id shouldBe 3
    iterator.hasNext shouldBe false
  }
}
