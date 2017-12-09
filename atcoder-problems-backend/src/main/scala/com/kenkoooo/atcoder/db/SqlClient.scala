package com.kenkoooo.atcoder.db

import com.kenkoooo.atcoder.common.SubmissionStatus
import com.kenkoooo.atcoder.common.TypeAnnotations.{ContestId, ProblemId, UserId}
import com.kenkoooo.atcoder.db.SqlClient._
import com.kenkoooo.atcoder.model._
import org.apache.logging.log4j.scala.Logging
import scalikejdbc._
import SQLSyntax.min
import scalikejdbc.interpolation.SQLSyntax
import sqls.{count, distinct}

import scala.util.Try

/**
  * Data Store of SQL
  *
  * @param url      JDBC url of SQL
  * @param user     username of SQL
  * @param password password of SQL
  */
class SqlClient(url: String, user: String, password: String) extends Logging {
  Class.forName("org.postgresql.Driver")
  ConnectionPool.singleton(url, user, password)

  private var _contests: Map[ContestId, Contest] = Map()
  private var _problems: Map[ProblemId, Problem] = Map()
  private var _acceptedCounts: List[AcceptedCount] = List()
  private var _firstSubmissionCounts: List[FirstSubmissionCount] = List()
  private var _fastestSubmissionCounts: List[FastestSubmissionCount] = List()
  private var _shortestSubmissionCounts: List[ShortestSubmissionCount] = List()
  private var _mergedProblems: List[MergedProblem] = List()
  private var _lastReloaded: Long = 0

  def contests: Map[String, Contest] = _contests

  def problems: Map[String, Problem] = _problems

  def acceptedCounts: List[AcceptedCount] = _acceptedCounts

  def firstSubmissionCounts: List[FirstSubmissionCount] = _firstSubmissionCounts

  def fastestSubmissionCounts: List[FastestSubmissionCount] = _fastestSubmissionCounts

  def shortestSubmissionCounts: List[ShortestSubmissionCount] = _shortestSubmissionCounts

  def mergedProblems: List[MergedProblem] = _mergedProblems

  def lastReloadedTimeMillis: Long = _lastReloaded

  private[db] def executeAndLoadSubmission(builder: SQLBuilder[_]): List[Submission] = {
    DB.readOnly { implicit session =>
      withSQL(builder).map(Submission(SubmissionSyntax)).list().apply()
    }
  }

  /**
    * Load submissions with given ids from SQL
    *
    * @param ids ids of submissions to load
    * @return list of loaded submissions
    */
  def loadSubmissions(ids: Long*): Iterator[Submission] = {
    SubmissionIterator(
      this,
      selectFrom(Submission as SubmissionSyntax).where.in(SubmissionSyntax.id, ids)
    )
  }

  /**
    * load submissions which are submitted by anyone in the given list
    *
    * @param userIds [[UserId]] to search submissions
    * @return [[Iterator]] of [[Submission]]
    */
  def loadUserSubmissions(userIds: UserId*): Iterator[Submission] = {
    SubmissionIterator(
      this,
      selectFrom(Submission as SubmissionSyntax).where.in(SubmissionSyntax.userId, userIds)
    )
  }

  def loadNoProblemContestList(): List[ContestId] = {
    val contests = Contest.syntax("contests")
    val problems = Problem.syntax("problems")
    DB.readOnly { implicit session =>
      withSQL {
        select(contests.result.id)
          .from(Contest as contests)
          .except(select(Problem.column.contestId).from(Problem as problems))
      }.map(_.string(contests.resultName.id)).list().apply()
    }
  }

  /**
    * rewrite accepted count ranking table
    */
  private[db] def updateAcceptedCounts(): Unit = {
    logger.info(s"updating ${AcceptedCount.tableName}")
    val columns = AcceptedCount.column
    val submission = Submission.syntax("s")
    DB.localTx { implicit session =>
      withSQL {
        deleteFrom(AcceptedCount)
      }.execute().apply()
      withSQL {
        insertInto(AcceptedCount)
          .columns(columns.userId, columns.problemCount)
          .select(submission.userId, count(distinct(submission.problemId)))(
            _.from(Submission as submission).where
              .eq(submission.c("result"), SubmissionStatus.Accepted)
              .groupBy(submission.userId)
          )
      }.update().apply()
    }
  }

  /**
    * update solver counts for each problems
    */
  private[db] def updateProblemSolverCounts(): Unit = {
    logger.info(s"updating ${ProblemSolver.tableName}")
    val v = ProblemSolver.column
    val s = Submission.syntax("s")
    DB.localTx { implicit session =>
      withSQL {
        deleteFrom(ProblemSolver)
      }.execute().apply()
      withSQL {
        insertInto(ProblemSolver)
          .columns(v.userCount, v.problemId)
          .select(sqls"${count(distinct(s.userId))}", s.problemId)(
            _.from(Submission as s).where
              .eq(s.c("result"), SubmissionStatus.Accepted)
              .groupBy(s.problemId)
          )
      }.execute().apply()
    }
  }

  private[db] def updateUserProblemCount[T](support: UserCountPairSupportWithParent[_, T]): Unit = {
    logger.info(s"updating ${support.tableName}")

    val columns = support.column
    val parentTable = support.parentSupport
    val parent = parentTable.syntax("p")
    val submissions = Submission.syntax("s")
    DB.localTx { implicit session =>
      withSQL {
        deleteFrom(support)
      }.update().apply()
      withSQL {
        insertInto(support)
          .columns(columns.problemCount, columns.userId)
          .select(count(distinct(parent.problemId)), submissions.userId)(
            _.from(parentTable as parent)
              .join(Submission as submissions)
              .on(submissions.id, parent.submissionId)
              .groupBy(submissions.userId)
          )
      }.update().apply()
    }
  }

  /**
    * update statistic tables
    */
  def batchUpdateStatisticTables(): Unit = {
    logger.info("start batch table update")
    updateAcceptedCounts()
    updateProblemSolverCounts()
    updateGreatSubmissions(First)
    updateGreatSubmissions(Fastest)
    updateGreatSubmissions(Shortest)
    updateUserProblemCount(FirstSubmissionCount)
    updateUserProblemCount(FastestSubmissionCount)
    updateUserProblemCount(ShortestSubmissionCount)
    logger.info("finished batch table update")
  }

  /**
    * extract min labeled submissions for each problems and store to another table
    *
    * @param support support object of reading and writing records
    */
  def updateGreatSubmissions(support: ProblemSubmissionPairSupport[_]): Unit = {
    logger.info(s"updating ${support.tableName}")

    val columns = support.column
    val submission = Submission.syntax("s")
    val blank = sqls"' '"
    val comparingColumn = support.extractComparingColumn(submission)

    // columns
    val problemId = submission.problemId
    val contestId = submission.contestId
    val submissionId = submission.id
    val result = submission.c("result")

    val contests = Contest.syntax("contests")

    DB.localTx { implicit session =>
      withSQL {
        deleteFrom(support)
      }.execute().apply()
      withSQL {
        insertInto(support)
          .columns(columns.contestId, columns.problemId, columns.submissionId)
          .select(contestId, problemId, submissionId)(
            _.from(Submission as submission).where
              .in(
                concat(problemId, blank, submissionId),
                select(concat(problemId, blank, min(submissionId)))
                  .from(Submission as submission)
                  .join(Contest as contests)
                  .on(contests.id, contestId)
                  .where
                  .in(
                    concat(problemId, blank, comparingColumn),
                    select(concat(problemId, blank, min(comparingColumn)))
                      .from(Submission as submission)
                      .join(Contest as contests)
                      .on(contests.id, contestId)
                      .where
                      .eq(result, SubmissionStatus.Accepted)
                      .and
                      .ge(submission.epochSecond, contests.startEpochSecond)
                      .groupBy(problemId)
                  )
                  .and
                  .eq(result, SubmissionStatus.Accepted)
                  .and
                  .ge(submission.epochSecond, contests.startEpochSecond)
                  .groupBy(problemId)
              )
              .and
              .eq(result, SubmissionStatus.Accepted)
          )
      }.update().apply()
    }
  }

  /**
    * reload internal contests and problems
    */
  def reloadRecords(): Unit = {
    _contests = loadRecords(Contest).map(s => s.id -> s).toMap
    _problems = loadRecords(Problem).map(s => s.id -> s).toMap

    _acceptedCounts = loadRecords(AcceptedCount).toList
    _firstSubmissionCounts = loadRecords(FirstSubmissionCount).toList
    _shortestSubmissionCounts = loadRecords(ShortestSubmissionCount).toList
    _fastestSubmissionCounts = loadRecords(FastestSubmissionCount).toList
    _mergedProblems = loadMergedProblems().toList

    _lastReloaded = System.currentTimeMillis()
  }

  /**
    * load all the records of the given type
    *
    * @param support support object for loading records
    * @tparam T type of the loading records
    * @return seq of loaded records
    */
  def loadRecords[T](support: SQLSelectSupport[T], limit: Int = 1000000): Seq[T] = {
    logger.info(s"loading ${support.tableName}")
    DB.readOnly { implicit session =>
      val s = support.syntax("s")
      withSQL(select.from(support as s).limit(limit))
        .map(support(s))
        .list()
        .apply()
    }
  }

  /**
    * load problem records with other statistic information
    *
    * @return [[Seq]] of [[Problem]]
    */
  def loadMergedProblems(): Seq[MergedProblem] = {
    logger.info("loading merged-problems")
    DB.readOnly { implicit session =>
      val problem = Problem.syntax("problem")
      val fastest = Fastest.syntax("fastest")
      val fastestSubmission = Submission.syntax("fastest_submission")
      val first = First.syntax("first")
      val firstSubmission = Submission.syntax("first_submission")
      val shortest = Shortest.syntax("shortest")
      val shortestSubmission = Submission.syntax("shortest_submission")
      val solver = ProblemSolver.syntax("solver")
      val points = Point.syntax("points")

      withSQL {
        select
          .from(Problem as problem)
          .leftJoin(Fastest as fastest)
          .on(fastest.problemId, problem.id)
          .leftJoin(Submission as fastestSubmission)
          .on(fastestSubmission.id, fastest.submissionId)
          .leftJoin(Shortest as shortest)
          .on(shortest.problemId, problem.id)
          .leftJoin(Submission as shortestSubmission)
          .on(shortestSubmission.id, shortest.submissionId)
          .leftJoin(First as first)
          .on(first.problemId, problem.id)
          .leftJoin(Submission as firstSubmission)
          .on(firstSubmission.id, first.submissionId)
          .leftJoin(ProblemSolver as solver)
          .on(solver.problemId, problem.id)
          .leftJoin(Point as points)
          .on(points.problemId, problem.id)
      }.map(
          MergedProblem(
            problem,
            fastestSubmission,
            firstSubmission,
            shortestSubmission,
            solver,
            points
          )
        )
        .list()
        .apply()
    }
  }

  /**
    * insert records to SQL
    *
    * @param support support object of inserting records
    * @param records seq of records to insert
    * @tparam T type of records
    */
  def batchInsert[T](support: SQLSelectInsertSupport[T], records: T*): Unit =
    this.synchronized {
      Try {
        DB.localTx { implicit session =>
          val params =
            support.createMapping(records).map(seq => seq.map(_._2))
          val columnMapping = support.createMapping(records).head.map(_._1 -> sqls.?)
          withSQL {
            insertInto(support)
              .namedValues(columnMapping: _*)
              .append(sqls"ON CONFLICT DO NOTHING")
          }.batch(params: _*).apply()
        }
      }.recover {
        case e: Throwable =>
          logger.catching(e)
          records.foreach(t => logger.error(t.toString))
      }
    }
}

private object SqlClient {
  private val SubmissionSyntax = Submission.syntax("s")

  def concat(columns: SQLSyntax*): SQLSyntax = sqls"concat(${sqls.csv(columns: _*)})"
}

/**
  * [[Iterator]] of [[Submission]] to iterate all the submission without expanding all the result to memory
  *
  * @param sqlClient [[SqlClient]] to connect to SQL
  * @param builder   [[SQLBuilder]] of selecting query
  * @param fetchSize the number of records in each fetch
  */
case class SubmissionIterator(sqlClient: SqlClient,
                              builder: SQLBuilder[_],
                              fetchSize: Int = SubmissionIterator.DefaultLimit)
    extends Iterator[Submission] {
  private var offset = 0
  private var currentList = List[Submission]()

  override def hasNext: Boolean = this.synchronized {
    if (currentList.isEmpty) {
      reload()
    }
    currentList.nonEmpty
  }

  override def next(): Submission = this.synchronized {
    require(hasNext)
    val head = currentList.head
    currentList = currentList.tail
    head
  }

  private def reload(): Unit = this.synchronized {
    currentList = sqlClient.executeAndLoadSubmission {
      builder.append(sqls.limit(fetchSize)).append(sqls.offset(offset))
    }
    offset += currentList.size
  }
}

object SubmissionIterator {
  private val DefaultLimit = 100000
}
