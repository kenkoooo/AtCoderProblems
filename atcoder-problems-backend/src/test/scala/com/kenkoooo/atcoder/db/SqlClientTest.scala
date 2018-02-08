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

  test("insert and reload submissions") {
    val id = 114514L
    val userId = "kenkoooo"
    val problemId = "arc999_a"

    val store = new SqlClient(url, sqlUser, sqlPass)
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
        contestId = "contest-id",
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
    val store = new SqlClient(url, sqlUser, sqlPass)
    store.batchInsert(Contest, Contest(id, 123456789, 987654321, "", ""))
    store.batchInsert(Contest, Contest(id, 123456789, 987654321, "", ""))
    store.reloadRecords()

    val contest = store.contests(id)
    contest.id shouldBe id
  }

  test("insert and reload problems") {
    val id = "arc999_d"
    val title = "日本語の問題 (Japanese Problem)"
    val store = new SqlClient(url, sqlUser, sqlPass)
    store.batchInsert(Problem, Problem(id, "arc999", title))
    store.batchInsert(Problem, Problem(id, "arc999", title))
    store.reloadRecords()

    val problem = store.problems(id)
    problem.id shouldBe id
    problem.title shouldBe title
  }

  test("load user submissions") {
    val client = new SqlClient(url, sqlUser, sqlPass)
    client.batchInsert(
      Submission,
      List(
        Submission(id = 1, 0, "", "iwiwi", "", 0.0, 0, "AC", "", None),
        Submission(id = 2, 0, "", "chokudai", "", 0.0, 0, "AC", "", None)
      ): _*
    )

    client.loadUserSubmissions("chokudai").toList.size shouldBe 1
    client.loadUserSubmissions("chokudai", "iwiwi").toList.size shouldBe 2
    client.loadUserSubmissions("chokudai", "iwiwi", "petr").toList.size shouldBe 2
  }

  test("update solver counts") {
    val client = new SqlClient(url, sqlUser, sqlPass)
    client.batchInsert(
      Submission,
      Submission(id = 1, problemId = "problem_1", userId = "user_1", result = "WA"),
      Submission(id = 2, problemId = "problem_1", userId = "user_1", result = "AC"),
      Submission(id = 3, problemId = "problem_1", userId = "user_1", result = "TLE"),
      Submission(id = 4, problemId = "problem_1", userId = "user_2", result = "AC"),
      Submission(id = 5, problemId = "problem_2", userId = "user_2", result = "AC"),
    )

    client.updateProblemSolverCounts()
    client.loadRecords(ProblemSolver).map(s => s.problemId -> s.userCount).toMap shouldBe Map(
      "problem_1" -> 2,
      "problem_2" -> 1
    )

    client.batchInsert(
      Submission,
      Submission(id = 6, problemId = "problem_1", userId = "user_3", result = "AC")
    )
    client.updateProblemSolverCounts()
    client.loadRecords(ProblemSolver).map(s => s.problemId -> s.userCount).toMap shouldBe Map(
      "problem_1" -> 3,
      "problem_2" -> 1
    )
  }

  test("extract shortest submissions") {
    val client = new SqlClient(url, sqlUser, sqlPass)
    val contestId = "contest_id"
    val startSecond = 114514L
    client.batchInsert(
      Contest,
      Contest(
        id = contestId,
        startEpochSecond = startSecond,
        durationSecond = 0,
        title = "",
        rateChange = ""
      )
    )

    client.batchInsert(
      Submission,
      Submission(
        id = 1,
        problemId = "problem_1",
        userId = "user_1",
        length = 5,
        result = "WA",
        contestId = contestId,
        epochSecond = startSecond
      ),
      Submission(
        id = 2,
        problemId = "problem_1",
        userId = "user_1",
        length = 5,
        result = "AC",
        contestId = contestId,
        epochSecond = startSecond
      ),
      Submission(
        id = 3,
        problemId = "problem_1",
        userId = "user_1",
        length = 5,
        result = "TLE",
        contestId = contestId,
        epochSecond = startSecond
      ),
      Submission(
        id = 4,
        problemId = "problem_1",
        userId = "user_2",
        length = 5,
        result = "AC",
        contestId = contestId,
        epochSecond = startSecond
      ),
      Submission(
        id = 5,
        problemId = "problem_2",
        userId = "user_2",
        length = 5,
        result = "AC",
        contestId = contestId,
        epochSecond = startSecond
      ),
    )
    client.updateGreatSubmissions(Shortest)
    client.loadRecords(Shortest).map(s => s.problemId -> s.submissionId).toMap shouldBe Map(
      "problem_1" -> 2,
      "problem_2" -> 5
    )
    client.updateUserProblemCount(ShortestSubmissionCount)
    client
      .loadRecords(ShortestSubmissionCount)
      .map(c => c.userId -> c.problemCount)
      .toMap shouldBe Map("user_1" -> 1, "user_2" -> 1)

    client.batchInsert(
      Submission,
      Submission(
        id = 6,
        problemId = "problem_2",
        userId = "user_1",
        length = 4,
        result = "AC",
        contestId = contestId,
        epochSecond = startSecond
      ),
    )
    client.updateGreatSubmissions(Shortest)
    client.loadRecords(Shortest).map(s => s.problemId -> s.submissionId).toMap shouldBe Map(
      "problem_1" -> 2,
      "problem_2" -> 6
    )
    client.updateUserProblemCount(ShortestSubmissionCount)
    client
      .loadRecords(ShortestSubmissionCount)
      .map(c => c.userId -> c.problemCount)
      .toMap shouldBe Map("user_1" -> 2)
  }

  test("extract shortest contest") {
    val client = new SqlClient(url, sqlUser, sqlPass)
    val contestId1 = "contest1"
    val contestId2 = "contest2"
    val startSecond = 114514L
    client.batchInsert(
      Contest,
      Contest(
        id = contestId1,
        startEpochSecond = startSecond,
        durationSecond = 0,
        title = "",
        rateChange = ""
      ),
      Contest(
        id = contestId2,
        startEpochSecond = startSecond,
        durationSecond = 0,
        title = "",
        rateChange = ""
      )
    )

    client.batchInsert(
      Submission,
      Submission(
        id = 1,
        problemId = "problem_1",
        userId = "user_1",
        length = 5,
        result = "AC",
        contestId = contestId1,
        epochSecond = startSecond
      ),
      Submission(
        id = 2,
        problemId = "problem_1",
        userId = "user_1",
        length = 5,
        result = "AC",
        contestId = contestId2,
        epochSecond = startSecond
      ),
    )
    client.updateGreatSubmissions(Shortest)
    client.loadRecords(Shortest).map(s => s.contestId -> s.submissionId).toMap shouldBe Map(
      "contest1" -> 1,
    )
  }

  test("extract fastest submissions") {
    val client = new SqlClient(url, sqlUser, sqlPass)
    val contestId = "contest_id"
    val startSecond = 114514L
    client.batchInsert(
      Contest,
      Contest(
        id = contestId,
        startEpochSecond = startSecond,
        durationSecond = 0,
        title = "",
        rateChange = ""
      )
    )

    client.batchInsert(
      Submission,
      Submission(
        id = 0,
        problemId = "p1",
        userId = "writer",
        executionTime = Some(0),
        result = "AC",
        contestId = contestId,
        epochSecond = startSecond - 10
      ),
      Submission(
        id = 1,
        problemId = "p1",
        userId = "u1",
        executionTime = Some(5),
        result = "WA",
        contestId = contestId,
        epochSecond = startSecond
      ),
      Submission(
        id = 2,
        problemId = "p1",
        userId = "u1",
        executionTime = Some(5),
        result = "AC",
        contestId = contestId,
        epochSecond = startSecond
      ),
      Submission(
        id = 3,
        problemId = "p1",
        userId = "u1",
        executionTime = Some(5),
        result = "TLE",
        contestId = contestId,
        epochSecond = startSecond
      ),
      Submission(
        id = 4,
        problemId = "p1",
        userId = "u2",
        executionTime = Some(5),
        result = "AC",
        contestId = contestId,
        epochSecond = startSecond
      ),
      Submission(
        id = 5,
        problemId = "p2",
        userId = "u2",
        executionTime = Some(5),
        result = "AC",
        contestId = contestId,
        epochSecond = startSecond
      ),
    )
    client.updateGreatSubmissions(Fastest)
    client.loadRecords(Fastest).map(s => s.problemId -> s.submissionId).toMap shouldBe Map(
      "p1" -> 2,
      "p2" -> 5
    )
    client.updateUserProblemCount(FastestSubmissionCount)
    client
      .loadRecords(FastestSubmissionCount)
      .map(c => c.userId -> c.problemCount)
      .toMap shouldBe Map("u1" -> 1, "u2" -> 1)

    client.batchInsert(
      Submission,
      Submission(
        id = 6,
        problemId = "p2",
        userId = "u1",
        executionTime = Some(4),
        result = "AC",
        contestId = contestId,
        epochSecond = startSecond
      ),
    )
    client.updateGreatSubmissions(Fastest)
    client.loadRecords(Fastest).map(s => s.problemId -> s.submissionId).toMap shouldBe Map(
      "p1" -> 2,
      "p2" -> 6
    )
    client.updateUserProblemCount(FastestSubmissionCount)
    client
      .loadRecords(FastestSubmissionCount)
      .map(c => c.userId -> c.problemCount)
      .toMap shouldBe Map("u1" -> 2)
  }

  test("extract first submissions") {
    val client = new SqlClient(url, sqlUser, sqlPass)
    val contestId = "contest_id"
    val startSecond = 114514L
    client.batchInsert(
      Contest,
      Contest(
        id = contestId,
        startEpochSecond = startSecond,
        durationSecond = 0,
        title = "",
        rateChange = ""
      )
    )

    client.batchInsert(
      Submission,
      Submission(
        id = 1,
        problemId = "p1",
        userId = "u1",
        result = "WA",
        epochSecond = startSecond,
        contestId = contestId
      ),
      Submission(
        id = 2,
        problemId = "p1",
        userId = "u1",
        result = "AC",
        epochSecond = startSecond,
        contestId = contestId
      ),
      Submission(
        id = 3,
        problemId = "p1",
        userId = "u1",
        result = "TLE",
        epochSecond = startSecond,
        contestId = contestId
      ),
      Submission(
        id = 4,
        problemId = "p1",
        userId = "u2",
        result = "AC",
        epochSecond = startSecond,
        contestId = contestId
      ),
      Submission(
        id = 5,
        problemId = "p2",
        userId = "u2",
        result = "AC",
        epochSecond = startSecond,
        contestId = contestId
      ),
    )
    client.updateGreatSubmissions(First)
    client.loadRecords(First).map(s => s.problemId -> s.submissionId).toMap shouldBe Map(
      "p1" -> 2,
      "p2" -> 5
    )
    client.updateUserProblemCount(FirstSubmissionCount)
    client
      .loadRecords(FirstSubmissionCount)
      .map(c => c.userId -> c.problemCount)
      .toMap shouldBe Map("u1" -> 1, "u2" -> 1)

    client.batchInsert(
      Submission,
      Submission(
        id = 6,
        problemId = "p2",
        userId = "u2",
        result = "AC",
        epochSecond = startSecond,
        contestId = contestId
      ),
      Submission(
        id = 7,
        problemId = "p3",
        userId = "u2",
        result = "AC",
        epochSecond = startSecond,
        contestId = contestId
      ),
    )
    client.updateGreatSubmissions(First)
    client.loadRecords(First).map(s => s.problemId -> s.submissionId).toMap shouldBe Map(
      "p1" -> 2,
      "p2" -> 5,
      "p3" -> 7
    )
    client.updateUserProblemCount(FirstSubmissionCount)
    client
      .loadRecords(FirstSubmissionCount)
      .map(c => c.userId -> c.problemCount)
      .toMap shouldBe Map("u1" -> 1, "u2" -> 2)
  }

  test("update accepted count ranking") {
    val client = new SqlClient(url, sqlUser, sqlPass)
    client.batchInsert(
      Submission,
      Submission(id = 1, problemId = "p1", userId = "u1", result = "WA"),
      Submission(id = 2, problemId = "p1", userId = "u1", result = "AC"),
      Submission(id = 3, problemId = "p1", userId = "u1", result = "TLE"),
      Submission(id = 4, problemId = "p1", userId = "u2", result = "AC"),
      Submission(id = 5, problemId = "p2", userId = "u2", result = "AC"),
    )
    client.updateAcceptedCounts()
    client.loadRecords(AcceptedCount).map(s => s.userId -> s.problemCount).toMap shouldBe Map(
      "u1" -> 1,
      "u2" -> 2
    )

    client.batchInsert(
      Submission,
      Submission(id = 6, problemId = "p2", userId = "u2", result = "AC"),
      Submission(id = 7, problemId = "p3", userId = "u2", result = "AC"),
      Submission(id = 8, problemId = "p1", userId = "u1", result = "AC"),
    )
    client.updateAcceptedCounts()
    client.loadRecords(AcceptedCount).map(s => s.userId -> s.problemCount).toMap shouldBe Map(
      "u1" -> 1,
      "u2" -> 3
    )
  }

  test("batch execution of statistics functions") {
    val client = new SqlClient(url, sqlUser, sqlPass)
    val contestId = "arc999"
    val problemId = "arc999_f"
    val contestant = "kenkoooo"
    val writer = "tomerun"
    val startEpochSecond = 114514L
    client.batchInsert(Contest, Contest(contestId, startEpochSecond, 0, "", ""))

    val submissionByContestant = Submission(
      id = 114514,
      problemId = problemId,
      userId = contestant,
      length = 11,
      executionTime = Some(22),
      result = "AC",
      epochSecond = startEpochSecond,
      contestId = contestId
    )
    val submissionByWriter = Submission(
      id = 1,
      problemId = problemId,
      userId = writer,
      length = 11,
      executionTime = Some(22),
      result = "AC",
      epochSecond = startEpochSecond - 10,
      contestId = contestId
    )

    client.batchInsert(Submission, submissionByContestant, submissionByWriter)
    client.batchUpdateStatisticTables()

    client.loadRecords(AcceptedCount).map(c => c.userId -> c.problemCount).toMap shouldBe Map(
      contestant -> 1,
      writer -> 1
    )
    client.loadRecords(ProblemSolver).head shouldBe ProblemSolver(problemId, 2)
    client.loadRecords(First).head shouldBe First(contestId, problemId, 114514)
    client.loadRecords(Fastest).head shouldBe Fastest(contestId, problemId, 114514)
    client.loadRecords(Shortest).head shouldBe Shortest(contestId, problemId, 114514)
    client.loadRecords(FirstSubmissionCount).head shouldBe FirstSubmissionCount(contestant, 1)
    client.loadRecords(FastestSubmissionCount).head shouldBe FastestSubmissionCount(contestant, 1)
    client.loadRecords(ShortestSubmissionCount).head shouldBe ShortestSubmissionCount(contestant, 1)
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

  test("update rated point sum table") {
    val client = new SqlClient(url, sqlUser, sqlPass)

    val ratedProblemId1 = "p1"
    val ratedProblemId2 = "p2"
    val unratedProblemId = "u"

    val userId1 = "u1"
    val userId2 = "u2"

    client.batchInsert(
      Submission,
      Submission(id = 1, problemId = ratedProblemId1, userId = userId1, result = "AC"),
      Submission(id = 2, problemId = ratedProblemId1, userId = userId1, result = "AC"),
      Submission(id = 3, problemId = ratedProblemId2, userId = userId1, result = "AC"),
      Submission(id = 4, problemId = unratedProblemId, userId = userId1, result = "AC"),
      Submission(id = 5, problemId = ratedProblemId1, userId = userId2, result = "WA"),
      Submission(id = 6, problemId = ratedProblemId2, userId = userId2, result = "AC")
    )

    DB.localTx { implicit session =>
      sql"INSERT INTO points (problem_id, point) VALUES ($ratedProblemId1, 100)".execute().apply()
      sql"INSERT INTO points (problem_id, point) VALUES ($ratedProblemId2, 200)".execute().apply()
      sql"INSERT INTO points (problem_id,predict) VALUES ($unratedProblemId,100)".execute().apply()
    }
    client.updateRatedPoints()
    client.loadRecords(RatedPointSum).map(s => s.userId -> s.pointSum).toMap shouldBe Map(
      userId1 -> 300,
      userId2 -> 200
    )
  }

  test("update language count table") {
    val client = new SqlClient(url, sqlUser, sqlPass)

    val userId = "u1"
    val pId1 = "p1"
    val pId2 = "p2"
    val langIdA1 = "Java10 (version 10.1)"
    val langIdA2 = "Java11 (version 11.3)"
    val langIdB = "Rust (2.0)"

    client.batchInsert(
      Submission,
      Submission(id = 1, problemId = pId1, language = langIdA1, userId = userId, result = "WA"),
      Submission(id = 2, problemId = pId1, language = langIdA1, userId = userId, result = "AC"),
      Submission(id = 3, problemId = pId1, language = langIdA2, userId = userId, result = "AC"),
      Submission(id = 4, problemId = pId2, language = langIdA1, userId = userId, result = "AC"),
      Submission(id = 5, problemId = pId1, language = langIdB, userId = userId, result = "AC"),
      Submission(id = 6, problemId = pId2, language = langIdB, userId = userId, result = "WA")
    )

    client.updateLanguageCount()
    client
      .loadRecords(LanguageCount)
      .map(c => (c.userId, c.simplifiedLanguage) -> c.problemCount)
      .toMap shouldBe Map(("u1", "Java") -> 2, ("u1", "Rust") -> 1)
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
