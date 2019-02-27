package com.kenkoooo.atcoder.db

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
    val client = new SqlClient()

    val problemId = "asc999_a"
    val contestId = "asc999"
    val title = "A * B problem"
    val submissionId = 114514

    val notSolvedProblemId = "not_solved"

    DB.localTx { implicit session =>
      sql"INSERT INTO points (problem_id, point) VALUES ($problemId, 1.0)".execute().apply()
      sql"INSERT INTO points (problem_id, predict) VALUES ($notSolvedProblemId, 1.0)"
        .execute()
        .apply()
      sql"INSERT INTO solver (problem_id, user_count) VALUES ($problemId, 1)".execute().apply()
      sql"INSERT INTO shortest (contest_id, problem_id, submission_id) VALUES ($contestId, $problemId, $submissionId)"
        .execute()
        .apply()
      sql"INSERT INTO fastest (contest_id, problem_id, submission_id) VALUES ($contestId, $problemId, $submissionId)"
        .execute()
        .apply()
      sql"INSERT INTO first (contest_id, problem_id, submission_id) VALUES ($contestId, $problemId, $submissionId)"
        .execute()
        .apply()
      sql"INSERT INTO problems (id, contest_id, title) VALUES ($problemId, $contestId, $title)"
        .execute()
        .apply()
      sql"INSERT INTO problems (id, contest_id, title) VALUES ($notSolvedProblemId, 'Difficult Contest', 'too difficult problem')"
        .execute()
        .apply()
    }

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
    val client = new SqlClient()
    val id1 = "contest1"
    val id2 = "contest2"

    DB.localTx { implicit session =>
      sql"INSERT INTO contests (id, start_epoch_second, duration_second, title, rate_change) VALUES ($id1, 0, 0, '', '')"
        .execute()
        .apply()
      sql"INSERT INTO contests (id, start_epoch_second, duration_second, title, rate_change) VALUES ($id2, 0, 0, '', '')"
        .execute()
        .apply()
      sql"INSERT INTO problems (id, contest_id, title) VALUES ('problem1', $id1, '')"
        .execute()
        .apply()
    }

    val contestIds = client.loadNoProblemContestList()
    contestIds.size shouldBe 1
    contestIds.head shouldBe id2
  }

  test("load predicted ratings") {
    val client = new SqlClient()
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
