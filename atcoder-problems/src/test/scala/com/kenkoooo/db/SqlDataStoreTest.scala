package com.kenkoooo.db

import com.kenkoooo.model.Submission
import org.scalatest.{BeforeAndAfter, BeforeAndAfterAll, FunSuite, Matchers}
import scalikejdbc._

import scala.io.Source

class SqlDataStoreTest extends FunSuite with BeforeAndAfter with Matchers with BeforeAndAfterAll {
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
      SQL(Source.fromResource("test-db.sql").getLines().mkString(" "))
        .execute()
        .apply()
    }
  }

  test("insert and reload") {
    val id = 114514L
    val userId = "kenkoooo"
    val problemId = "arc999_a"

    val store = new SqlDataStore(url, sqlUser, sqlPass, driver)
    store.insertSubmission(
      Submission(
        id = id,
        epochSecond = System.currentTimeMillis(),
        problemId = problemId,
        user = userId,
        language = "Rust (1.21.0)",
        point = 100,
        length = 200,
        result = "WA",
        executionTime = None
      )
    )
    store.reloadSubmissions()

    val submission = store.submission(id)
    submission.id shouldBe id
    submission.problemId shouldBe problemId
    submission.user shouldBe userId
  }
}
