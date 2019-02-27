package com.kenkoooo.atcoder.db

import com.kenkoooo.atcoder.model._
import org.scalatest.{BeforeAndAfter, FunSuite, Matchers}
import scalikejdbc._

import scala.io.Source

class SqlClientTest extends FunSuite with BeforeAndAfter with Matchers {
  val url = "jdbc:postgresql://localhost:5432/test"
  val sqlUser = "kenkoooo"
  val sqlPass = "pass"

  Class.forName("org.postgresql.Driver")
  ConnectionPool.singleton(url, sqlUser, sqlPass)

  before {
    // initialize the test database
    DB.localTx { implicit session =>
      SQL(Source.fromResource("test-db.sql").mkString)
        .execute()
        .apply()
    }
  }

  test("load merged problem info") {
    val client = new SqlClient(url, sqlUser, sqlPass)

    val problemId = "asc999_a"
    val contestId = "asc999"
    val title = "A * B problem"
    val userId = "kenkoooo"

    val notSolvedProblemId = "not_solved"

    client.batchInsert(
      Problem,
      Problem(problemId, contestId, title),
      Problem(notSolvedProblemId, "Difficult Contest", "too difficult problem")
    )
    client.batchInsert(
      Submission,
      Submission(
        id = 1,
        problemId = problemId,
        userId = userId,
        result = "AC",
        length = 114,
        executionTime = Some(514),
        contestId = contestId
      )
    )
    DB.localTx { implicit session =>
      sql"INSERT INTO points (problem_id, point) VALUES ($problemId, 1.0)".execute().apply()
      sql"INSERT INTO points (problem_id, predict) VALUES ($notSolvedProblemId, 1.0)"
        .execute()
        .apply()
    }

    client.batchUpdateStatisticTables()
    val problems = client.loadMergedProblems()
    problems.find(_.id == problemId).get.solverCount shouldBe 1
    problems.find(_.id == problemId).get.contestId shouldBe contestId
    problems.find(_.id == problemId).get.point.get shouldBe 1.0
    problems.find(_.id == problemId).get.predict shouldBe None
    problems.find(_.id == notSolvedProblemId).get.solverCount shouldBe 0
    problems.find(_.id == notSolvedProblemId).get.point shouldBe None
    problems.find(_.id == notSolvedProblemId).get.predict.get shouldBe 1.0
  }

  test("extract contests which don't have any problems") {
    val client = new SqlClient(url, sqlUser, sqlPass)
    val id1 = "contest1"
    val id2 = "contest2"

    client.batchInsert(Contest, Contest(id1, 0, 0, "", ""), Contest(id2, 0, 0, "", ""))
    client.batchInsert(Problem, Problem("problem1", id1, ""))

    val contestIds = client.loadNoProblemContestList()
    contestIds.size shouldBe 1
    contestIds.head shouldBe id2
  }

  test("load predicted ratings") {
    val client = new SqlClient(url, sqlUser, sqlPass)
    val userId = "kenkoooo"
    val rating = 3.14
    DB.localTx { implicit session =>
      sql"INSERT INTO predicted_rating (user_id, rating) VALUES ($userId, $rating)"
        .execute()
        .apply()
    }
    client.reloadRecords()
    client.predictedRatings.size shouldBe 1
    client.predictedRatings.head.userId shouldBe userId
    client.predictedRatings.head.rating shouldBe rating
  }
}
