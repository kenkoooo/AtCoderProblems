package com.kenkoooo.atcoder.db

import com.kenkoooo.atcoder.common.TypeAnnotations.{ContestId, ProblemId, UserId}
import com.kenkoooo.atcoder.db.SqlViewer._
import com.kenkoooo.atcoder.db.traits.ContestLoader
import com.kenkoooo.atcoder.model._
import org.apache.logging.log4j.scala.Logging
import scalikejdbc._
import scalikejdbc.interpolation.SQLSyntax
import sqls.count

/**
  * Data Store of SQL
  */
class SqlViewer extends Logging with ContestLoader {

  private var contests: Map[ContestId, Contest] = Map()
  private var _problems: Map[ProblemId, Problem] = Map()
  private var _firstSubmissionCounts: List[FirstSubmissionCount] = List()
  private var _fastestSubmissionCounts: List[FastestSubmissionCount] = List()
  private var _shortestSubmissionCounts: List[ShortestSubmissionCount] = List()
  private var _mergedProblems: List[MergedProblem] = List()
  private var _languageCounts: List[LanguageCount] = List()
  private var _predictedRatings: List[PredictedRating] = List()
  private var _lastReloaded: Long = 0

  private var ratedPointSumInfo = new RatedPointSumInfo(List())
  private var acceptedCountInfo = new AcceptedCountInfo(List())

  def problems: Map[String, Problem] = _problems

  def acceptedCounts: List[AcceptedCount] = acceptedCountInfo.list

  def firstSubmissionCounts: List[FirstSubmissionCount] = _firstSubmissionCounts

  def fastestSubmissionCounts: List[FastestSubmissionCount] = _fastestSubmissionCounts

  def shortestSubmissionCounts: List[ShortestSubmissionCount] = _shortestSubmissionCounts

  def mergedProblems: List[MergedProblem] = _mergedProblems

  def ratedPointSums: List[RatedPointSum] = ratedPointSumInfo.list

  def languageCounts: List[LanguageCount] = _languageCounts

  def predictedRatings: List[PredictedRating] = _predictedRatings

  def lastReloadedTimeMillis: Long = _lastReloaded

  def pointAndRankOf(userId: UserId): (Double, Int) = ratedPointSumInfo.pointAndRankOf(userId)
  def countAndRankOf(userId: UserId): (Int, Int) = acceptedCountInfo.countAndRankOf(userId)

  private[db] def executeAndLoadSubmission(builder: SQLBuilder[_]): List[Submission] =
    this.synchronized {
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
    * load the number of submissions which are submitted by anyone in the given list
    *
    * @param userIds [[UserId]] to search submissions
    * @return the number of submissions
    */
  def loadUserSubmissionCount(userIds: UserId*): Long = {
    DB.readOnly { implicit session =>
      withSQL {
        select(count)
          .from(Submission as SubmissionSyntax)
          .where
          .in(SubmissionSyntax.userId, userIds)
      }.map(_.long(1)).single().apply().getOrElse(0L)
    }
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
    * reload internal contests and problems
    */
  def reloadRecords(): Unit = {
    contests = loadRecords(Contest).map(s => s.id -> s).toMap
    _problems = loadRecords(Problem).map(s => s.id -> s).toMap

    acceptedCountInfo = new AcceptedCountInfo(loadRecords(AcceptedCount).toList)
    _firstSubmissionCounts = loadRecords(FirstSubmissionCount).toList
    _shortestSubmissionCounts = loadRecords(ShortestSubmissionCount).toList
    _fastestSubmissionCounts = loadRecords(FastestSubmissionCount).toList
    _mergedProblems = loadMergedProblems().toList
    ratedPointSumInfo = new RatedPointSumInfo(loadRecords(RatedPointSum).toList)
    _languageCounts = loadRecords(LanguageCount).toList
    _predictedRatings = loadRecords(PredictedRating).toList

    _lastReloaded = System.currentTimeMillis()
  }

  /**
    * load all the records of the given type
    *
    * @param support support object for loading records
    * @tparam T type of the loading records
    * @return seq of loaded records
    */
  private def loadRecords[T](support: SQLSelectSupport[T], limit: Int = 1000000): Seq[T] = {
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
  private[db] def loadMergedProblems(): Seq[MergedProblem] = {
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

  override def loadContest(): List[Contest] = contests.values.toList
}

private object SqlViewer {
  private val SubmissionSyntax = Submission.syntax("s")

  def concat(columns: SQLSyntax*): SQLSyntax = sqls"concat(${sqls.csv(columns: _*)})"

  def reduce[T](sortedList: List[T]): Map[T, Int] = {
    var map = Map[T, Int]()
    for ((point, index) <- sortedList.zipWithIndex) {
      if (index == 0 || point != sortedList(index - 1)) {
        map += (point -> index)
      }
    }
    map
  }
}

/**
  * [[Iterator]] of [[Submission]] to iterate all the submission without expanding all the result to memory
  *
  * @param sqlClient [[SqlViewer]] to connect to SQL
  * @param builder   [[SQLBuilder]] of selecting query
  * @param fetchSize the number of records in each fetch
  */
case class SubmissionIterator(sqlClient: SqlViewer,
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
