package com.kenkoooo.atcoder.db

import com.kenkoooo.atcoder.model.{Contest, Problem, Submission}
import org.scalatest.{BeforeAndAfter, FunSuite, Matchers}
import scalikejdbc._

import scala.io.Source

class SqlClientTest extends FunSuite with BeforeAndAfter with Matchers {
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

  test("insert and reload submissions") {
    val id = 114514L
    val userId = "kenkoooo"
    val problemId = "arc999_a"

    val store = new SqlClient(url, sqlUser, sqlPass, driver)
    store.batchInsert(
      Submission,
      Submission(
        id = id,
        epochSecond = System.currentTimeMillis(),
        problemId = "old information...",
        userId = userId,
        language = "Rust (1.21.0)",
        point = 100,
        length = 200,
        result = "WA",
        executionTime = None
      )
    )
    store.batchInsert(
      Submission,
      Submission(
        id = id,
        epochSecond = System.currentTimeMillis(),
        problemId = problemId,
        userId = userId,
        language = "Rust (1.21.0)",
        point = 100,
        length = 200,
        result = "WA",
        executionTime = None
      )
    )

    val submission = store.loadSubmissions(id).next()
    submission.id shouldBe id
    submission.problemId shouldBe problemId
    submission.userId shouldBe userId
  }

  test("insert and reload contests") {
    val id = "arc999"
    val store = new SqlClient(url, sqlUser, sqlPass, driver)
    store.batchInsert(Contest, Contest(id, 123456789, 987654321, "", ""))
    store.batchInsert(Contest, Contest(id, 123456789, 987654321, "", ""))
    store.reloadRecords()

    val contest = store.contests(id)
    contest.id shouldBe id
  }

  test("insert and reload problems") {
    val id = "arc999_d"
    val store = new SqlClient(url, sqlUser, sqlPass, driver)
    store.batchInsert(Problem, Problem(id, "arc999", "A+B Problem"))
    store.batchInsert(Problem, Problem(id, "arc999", "A+B Problem"))
    store.reloadRecords()

    val problem = store.problems(id)
    problem.id shouldBe id
  }

  test("load user submissions") {
    val client = new SqlClient(url, sqlUser, sqlPass, driver)
    client.batchInsert(
      Submission,
      List(
        Submission(id = 1, 0, "", "iwiwi", "", 0.0, 0, "AC", None),
        Submission(id = 2, 0, "", "chokudai", "", 0.0, 0, "AC", None)
      ): _*
    )

    client.loadUserSubmissions("chokudai").size shouldBe 1
    client.loadUserSubmissions("chokudai", "iwiwi").size shouldBe 2
    client.loadUserSubmissions("chokudai", "iwiwi", "petr").size shouldBe 2
  }
}
