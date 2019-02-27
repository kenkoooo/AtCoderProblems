package com.kenkoooo.atcoder.db
import com.kenkoooo.atcoder.model._
import org.scalatest.{BeforeAndAfter, FunSuite, Matchers, PrivateMethodTester}
import scalikejdbc.{ConnectionPool, DB, SQL, _}

import scala.io.Source

class SqlUpdaterTest extends FunSuite with BeforeAndAfter with Matchers with PrivateMethodTester {
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

  def selectRecords[T](support: SQLSelectSupport[T]): Seq[T] = {
    DB.readOnly { implicit session =>
      val s = support.syntax("s")
      withSQL(select.from(support as s))
        .map(support(s))
        .list()
        .apply()
    }
  }

  test("insert and reload contests") {
    val id = "arc999"
    val store = new SqlUpdater(url, sqlUser, sqlPass)
    store.batchInsert(Contest, Contest(id, 123456789, 987654321, "", ""))
    store.batchInsert(Contest, Contest(id, 123456789, 987654321, "", ""))

    val contests = selectRecords(Contest)
    contests.head.id shouldBe id
  }

  test("insert and reload problems") {
    val id = "arc999_d"
    val title = "日本語の問題 (Japanese Problem)"
    val store = new SqlUpdater(url, sqlUser, sqlPass)
    store.batchInsert(Problem, Problem(id, "arc999", title))
    store.batchInsert(Problem, Problem(id, "arc999", title))

    val problems = selectRecords(Problem)

    problems.head.id shouldBe id
    problems.head.title shouldBe title
  }

  test("load user submissions") {
    val updater = new SqlUpdater(url, sqlUser, sqlPass)
    updater.batchInsert(
      Submission,
      List(
        Submission(id = 1, 0, "", "iwiwi", "", 0.0, 0, "AC", "", None),
        Submission(id = 2, 0, "", "chokudai", "", 0.0, 0, "AC", "", None)
      ): _*
    )

    val submissions = selectRecords(Submission)
    submissions.count(_.userId == "chokudai") shouldBe 1
    submissions.count(s => Array("chokudai", "iwiwi").contains(s.userId)) shouldBe 2
    submissions.count(s => Array("chokudai", "iwiwi", "pter").contains(s.userId)) shouldBe 2
  }

  test("update solver counts") {
    val updater = new SqlUpdater(url, sqlUser, sqlPass)
    updater.batchInsert(
      Submission,
      Submission(id = 1, problemId = "problem_1", userId = "user_1", result = "WA"),
      Submission(id = 2, problemId = "problem_1", userId = "user_1", result = "AC"),
      Submission(id = 3, problemId = "problem_1", userId = "user_1", result = "TLE"),
      Submission(id = 4, problemId = "problem_1", userId = "user_2", result = "AC"),
      Submission(id = 5, problemId = "problem_2", userId = "user_2", result = "AC"),
    )

    val updateProblemSolverCounts = PrivateMethod[SqlUpdater]('updateProblemSolverCounts)
    updater invokePrivate updateProblemSolverCounts()

    selectRecords(ProblemSolver).map(s => s.problemId -> s.userCount).toMap shouldBe Map(
      "problem_1" -> 2,
      "problem_2" -> 1
    )

    updater.batchInsert(
      Submission,
      Submission(id = 6, problemId = "problem_1", userId = "user_3", result = "AC")
    )
    updater invokePrivate updateProblemSolverCounts()
    selectRecords(ProblemSolver).map(s => s.problemId -> s.userCount).toMap shouldBe Map(
      "problem_1" -> 3,
      "problem_2" -> 1
    )
  }

  test("extract shortest submissions") {
    val updater = new SqlUpdater(url, sqlUser, sqlPass)
    val contestId = "contest_id"
    val startSecond = 114514L
    updater.batchInsert(
      Contest,
      Contest(
        id = contestId,
        startEpochSecond = startSecond,
        durationSecond = 0,
        title = "",
        rateChange = ""
      )
    )

    updater.batchInsert(
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
    updater.updateGreatSubmissions(Shortest)
    selectRecords(Shortest).map(s => s.problemId -> s.submissionId).toMap shouldBe Map(
      "problem_1" -> 2,
      "problem_2" -> 5
    )
    val updateUserProblemCount = PrivateMethod[SqlUpdater]('updateUserProblemCount)
    updater.invokePrivate(updateUserProblemCount(ShortestSubmissionCount))
    selectRecords(ShortestSubmissionCount)
      .map(c => c.userId -> c.problemCount)
      .toMap shouldBe Map("user_1" -> 1, "user_2" -> 1)

    updater.batchInsert(
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
    updater.updateGreatSubmissions(Shortest)
    selectRecords(Shortest).map(s => s.problemId -> s.submissionId).toMap shouldBe Map(
      "problem_1" -> 2,
      "problem_2" -> 6
    )

    selectRecords(ShortestSubmissionCount)
    updater.invokePrivate(updateUserProblemCount(ShortestSubmissionCount))
    selectRecords(ShortestSubmissionCount)
      .map(c => c.userId -> c.problemCount)
      .toMap shouldBe Map("user_1" -> 2)
  }

  test("extract shortest contest") {
    val updater = new SqlUpdater(url, sqlUser, sqlPass)
    val contestId1 = "contest1"
    val contestId2 = "contest2"
    val startSecond = 114514L
    updater.batchInsert(
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

    updater.batchInsert(
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
    updater.updateGreatSubmissions(Shortest)
    selectRecords(Shortest).map(s => s.contestId -> s.submissionId).toMap shouldBe Map(
      "contest1" -> 1,
    )
  }

  test("extract fastest submissions") {
    val updater = new SqlUpdater(url, sqlUser, sqlPass)
    val contestId = "contest_id"
    val startSecond = 114514L
    updater.batchInsert(
      Contest,
      Contest(
        id = contestId,
        startEpochSecond = startSecond,
        durationSecond = 0,
        title = "",
        rateChange = ""
      )
    )

    updater.batchInsert(
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
    updater.updateGreatSubmissions(Fastest)
    selectRecords(Fastest).map(s => s.problemId -> s.submissionId).toMap shouldBe Map(
      "p1" -> 2,
      "p2" -> 5
    )
    val updateUserProblemCount = PrivateMethod[SqlUpdater]('updateUserProblemCount)
    updater.invokePrivate(updateUserProblemCount(FastestSubmissionCount))
    selectRecords(FastestSubmissionCount)
      .map(c => c.userId -> c.problemCount)
      .toMap shouldBe Map("u1" -> 1, "u2" -> 1)

    updater.batchInsert(
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
    updater.updateGreatSubmissions(Fastest)
    selectRecords(Fastest).map(s => s.problemId -> s.submissionId).toMap shouldBe Map(
      "p1" -> 2,
      "p2" -> 6
    )

    updater.invokePrivate(updateUserProblemCount(FastestSubmissionCount))
    selectRecords(FastestSubmissionCount)
      .map(c => c.userId -> c.problemCount)
      .toMap shouldBe Map("u1" -> 2)
  }

  test("extract first submissions") {
    val updater = new SqlUpdater(url, sqlUser, sqlPass)
    val contestId = "contest_id"
    val startSecond = 114514L
    updater.batchInsert(
      Contest,
      Contest(
        id = contestId,
        startEpochSecond = startSecond,
        durationSecond = 0,
        title = "",
        rateChange = ""
      )
    )

    updater.batchInsert(
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
    updater.updateGreatSubmissions(First)
    selectRecords(First).map(s => s.problemId -> s.submissionId).toMap shouldBe Map(
      "p1" -> 2,
      "p2" -> 5
    )
    val updateUserProblemCount = PrivateMethod[SqlUpdater]('updateUserProblemCount)
    updater invokePrivate updateUserProblemCount(FirstSubmissionCount)
    selectRecords(FirstSubmissionCount)
      .map(c => c.userId -> c.problemCount)
      .toMap shouldBe Map("u1" -> 1, "u2" -> 1)

    updater.batchInsert(
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
    updater.updateGreatSubmissions(First)
    selectRecords(First).map(s => s.problemId -> s.submissionId).toMap shouldBe Map(
      "p1" -> 2,
      "p2" -> 5,
      "p3" -> 7
    )
    updater invokePrivate updateUserProblemCount(FirstSubmissionCount)
    selectRecords(FirstSubmissionCount)
      .map(c => c.userId -> c.problemCount)
      .toMap shouldBe Map("u1" -> 1, "u2" -> 2)
  }

  test("update accepted count ranking") {
    val updater = new SqlUpdater(url, sqlUser, sqlPass)
    updater.batchInsert(
      Submission,
      Submission(id = 1, problemId = "p1", userId = "u1", result = "WA"),
      Submission(id = 2, problemId = "p1", userId = "u1", result = "AC"),
      Submission(id = 3, problemId = "p1", userId = "u1", result = "TLE"),
      Submission(id = 4, problemId = "p1", userId = "u2", result = "AC"),
      Submission(id = 5, problemId = "p2", userId = "u2", result = "AC"),
    )
    val updateAcceptedCounts = PrivateMethod[SqlUpdater]('updateAcceptedCounts)
    updater invokePrivate updateAcceptedCounts()
    selectRecords(AcceptedCount).map(s => s.userId -> s.problemCount).toMap shouldBe Map(
      "u1" -> 1,
      "u2" -> 2
    )

    updater.batchInsert(
      Submission,
      Submission(id = 6, problemId = "p2", userId = "u2", result = "AC"),
      Submission(id = 7, problemId = "p3", userId = "u2", result = "AC"),
      Submission(id = 8, problemId = "p1", userId = "u1", result = "AC"),
    )
    updater invokePrivate updateAcceptedCounts()
    selectRecords(AcceptedCount).map(s => s.userId -> s.problemCount).toMap shouldBe Map(
      "u1" -> 1,
      "u2" -> 3
    )
  }

  test("batch execution of statistics functions") {
    val updater = new SqlUpdater(url, sqlUser, sqlPass)
    val contestId = "arc999"
    val problemId = "arc999_f"
    val contestant = "kenkoooo"
    val writer = "tomerun"
    val startEpochSecond = 114514L
    updater.batchInsert(Contest, Contest(contestId, startEpochSecond, 0, "", ""))

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

    updater.batchInsert(Submission, submissionByContestant, submissionByWriter)
    updater.updateAll()

    selectRecords(AcceptedCount).map(c => c.userId -> c.problemCount).toMap shouldBe Map(
      contestant -> 1,
      writer -> 1
    )
    selectRecords(ProblemSolver).head shouldBe ProblemSolver(problemId, 2)
    selectRecords(First).head shouldBe First(contestId, problemId, 114514)
    selectRecords(Fastest).head shouldBe Fastest(contestId, problemId, 114514)
    selectRecords(Shortest).head shouldBe Shortest(contestId, problemId, 114514)
    selectRecords(FirstSubmissionCount).head shouldBe FirstSubmissionCount(contestant, 1)
    selectRecords(FastestSubmissionCount).head shouldBe FastestSubmissionCount(contestant, 1)
    selectRecords(ShortestSubmissionCount).head shouldBe ShortestSubmissionCount(contestant, 1)
  }

  test("update rated point sum table") {
    val updater = new SqlUpdater(url, sqlUser, sqlPass)

    val ratedProblemId1 = "p1"
    val ratedProblemId2 = "p2"
    val unratedProblemId = "u"

    val userId1 = "u1"
    val userId2 = "u2"

    updater.batchInsert(
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
    val updateRatedPointSums = PrivateMethod[SqlUpdater]('updateRatedPointSums)
    updater invokePrivate updateRatedPointSums()
    selectRecords(RatedPointSum).map(s => s.userId -> s.pointSum).toMap shouldBe Map(
      userId1 -> 300,
      userId2 -> 200
    )
  }

  test("update language count table") {
    val updater = new SqlUpdater(url, sqlUser, sqlPass)

    val userId = "u1"
    val pId1 = "p1"
    val pId2 = "p2"
    val langIdA1 = "Java10 (version 10.1)"
    val langIdA2 = "Java11 (version 11.3)"
    val langIdB = "Rust (2.0)"

    updater.batchInsert(
      Submission,
      Submission(id = 1, problemId = pId1, language = langIdA1, userId = userId, result = "WA"),
      Submission(id = 2, problemId = pId1, language = langIdA1, userId = userId, result = "AC"),
      Submission(id = 3, problemId = pId1, language = langIdA2, userId = userId, result = "AC"),
      Submission(id = 4, problemId = pId2, language = langIdA1, userId = userId, result = "AC"),
      Submission(id = 5, problemId = pId1, language = langIdB, userId = userId, result = "AC"),
      Submission(id = 6, problemId = pId2, language = langIdB, userId = userId, result = "WA")
    )

    val updateLanguageCount = PrivateMethod[SqlUpdater]('updateLanguageCount)
    updater invokePrivate updateLanguageCount()
    selectRecords(LanguageCount)
      .map(c => (c.userId, c.simplifiedLanguage) -> c.problemCount)
      .toMap shouldBe Map(("u1", "Java") -> 2, ("u1", "Rust") -> 1)
  }
}
