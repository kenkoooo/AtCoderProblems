package com.kenkoooo.atcoder.db

import com.kenkoooo.atcoder.model._
import org.scalatest.{BeforeAndAfter, FunSuite, Matchers}
import scalikejdbc._

import scala.io.Source

class SqlClientTest extends FunSuite with BeforeAndAfter with Matchers {
  val driver = "org.h2.Driver"
  val url = "jdbc:h2:mem:Test;mode=MySQL;DB_CLOSE_DELAY=-1"
  val sqlUser = "user"
  val sqlPass = "pass"

  //  val url = "jdbc:mysql://localhost:3306/test?useSSL=false"
  //  val sqlUser = "root"
  //  val sqlPass = "toor"
  //  val driver = "com.mysql.cj.jdbc.Driver"

  Class.forName(driver)
  ConnectionPool.singleton(url, sqlUser, sqlPass)

  before {
    // initialize the test database
    DB.localTx { implicit session =>
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

    client.loadUserSubmissions("chokudai").toList.size shouldBe 1
    client.loadUserSubmissions("chokudai", "iwiwi").toList.size shouldBe 2
    client.loadUserSubmissions("chokudai", "iwiwi", "petr").toList.size shouldBe 2
  }

  test("load all the accepted submissions") {
    val client = new SqlClient(url, sqlUser, sqlPass, driver)
    client.batchInsert(
      Submission,
      List(
        Submission(id = 1, 0, "", "iwiwi", "", 0.0, 0, "AC", None),
        Submission(id = 2, 0, "", "chokudai", "", 0.0, 0, "WA", None)
      ): _*
    )

    client.loadAllAcceptedSubmissions().toList.size shouldBe 1
  }

  test("update solver counts") {
    val client = new SqlClient(url, sqlUser, sqlPass, driver)
    client.batchInsert(
      Submission,
      Submission(id = 1, problemId = "problem_1", userId = "user_1", result = "WA"),
      Submission(id = 2, problemId = "problem_1", userId = "user_1", result = "AC"),
      Submission(id = 3, problemId = "problem_1", userId = "user_1", result = "TLE"),
      Submission(id = 4, problemId = "problem_1", userId = "user_2", result = "AC"),
      Submission(id = 5, problemId = "problem_2", userId = "user_2", result = "AC"),
    )

    client.updateSolverCounts()
    client.reload(Solver).map(s => s.problemId -> s.solvers).toMap shouldBe Map(
      "problem_1" -> 2,
      "problem_2" -> 1
    )

    client.batchInsert(
      Submission,
      Submission(id = 6, problemId = "problem_1", userId = "user_3", result = "AC")
    )
    client.updateSolverCounts()
    client.reload(Solver).map(s => s.problemId -> s.solvers).toMap shouldBe Map(
      "problem_1" -> 3,
      "problem_2" -> 1
    )
  }

  test("extract shortest submissions") {
    val client = new SqlClient(url, sqlUser, sqlPass, driver)
    client.batchInsert(
      Submission,
      Submission(id = 1, problemId = "problem_1", userId = "user_1", length = 5, result = "WA"),
      Submission(id = 2, problemId = "problem_1", userId = "user_1", length = 5, result = "AC"),
      Submission(id = 3, problemId = "problem_1", userId = "user_1", length = 5, result = "TLE"),
      Submission(id = 4, problemId = "problem_1", userId = "user_2", length = 5, result = "AC"),
      Submission(id = 5, problemId = "problem_2", userId = "user_2", length = 5, result = "AC"),
    )
    client.rewriteGreatSubmissions(Shortest)
    client.reload(Shortest).map(s => s.problemId -> s.submissionId).toMap shouldBe Map(
      "problem_1" -> 2,
      "problem_2" -> 5
    )

    client.batchInsert(
      Submission,
      Submission(id = 6, problemId = "problem_2", userId = "user_2", length = 4, result = "AC"),
    )
    client.rewriteGreatSubmissions(Shortest)
    client.reload(Shortest).map(s => s.problemId -> s.submissionId).toMap shouldBe Map(
      "problem_1" -> 2,
      "problem_2" -> 6
    )
  }

  test("extract fastest submissions") {
    val client = new SqlClient(url, sqlUser, sqlPass, driver)
    client.batchInsert(
      Submission,
      Submission(id = 1, problemId = "p1", userId = "u1", executionTime = Some(5), result = "WA"),
      Submission(id = 2, problemId = "p1", userId = "u1", executionTime = Some(5), result = "AC"),
      Submission(id = 3, problemId = "p1", userId = "u1", executionTime = Some(5), result = "TLE"),
      Submission(id = 4, problemId = "p1", userId = "u2", executionTime = Some(5), result = "AC"),
      Submission(id = 5, problemId = "p2", userId = "u2", executionTime = Some(5), result = "AC"),
    )
    client.rewriteGreatSubmissions(Fastest)
    client.reload(Fastest).map(s => s.problemId -> s.submissionId).toMap shouldBe Map(
      "p1" -> 2,
      "p2" -> 5
    )

    client.batchInsert(
      Submission,
      Submission(id = 6, problemId = "p2", userId = "u2", executionTime = Some(4), result = "AC"),
    )
    client.rewriteGreatSubmissions(Fastest)
    client.reload(Fastest).map(s => s.problemId -> s.submissionId).toMap shouldBe Map(
      "p1" -> 2,
      "p2" -> 6
    )
  }

  test("extract first submissions") {
    val client = new SqlClient(url, sqlUser, sqlPass, driver)
    client.batchInsert(
      Submission,
      Submission(id = 1, problemId = "p1", userId = "u1", result = "WA"),
      Submission(id = 2, problemId = "p1", userId = "u1", result = "AC"),
      Submission(id = 3, problemId = "p1", userId = "u1", result = "TLE"),
      Submission(id = 4, problemId = "p1", userId = "u2", result = "AC"),
      Submission(id = 5, problemId = "p2", userId = "u2", result = "AC"),
    )
    client.rewriteGreatSubmissions(First)
    client.reload(First).map(s => s.problemId -> s.submissionId).toMap shouldBe Map(
      "p1" -> 2,
      "p2" -> 5
    )

    client.batchInsert(
      Submission,
      Submission(id = 6, problemId = "p2", userId = "u2", result = "AC"),
    )
    client.rewriteGreatSubmissions(First)
    client.reload(First).map(s => s.problemId -> s.submissionId).toMap shouldBe Map(
      "p1" -> 2,
      "p2" -> 5
    )
  }
}
