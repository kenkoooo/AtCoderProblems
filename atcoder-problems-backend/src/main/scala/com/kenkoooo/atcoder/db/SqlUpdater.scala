package com.kenkoooo.atcoder.db

import com.kenkoooo.atcoder.common.SubmissionStatus
import com.kenkoooo.atcoder.db.SqlUpdater.concat
import com.kenkoooo.atcoder.model._
import org.apache.logging.log4j.scala.Logging
import scalikejdbc._
import SQLSyntax.min
import com.kenkoooo.atcoder.db.traits.SqlInsert
import scalikejdbc.interpolation.SQLSyntax
import sqls.{count, distinct}

import scala.util.Try

class SqlUpdater extends Logging with SqlInsert {

  def updateAll(): Unit = {
    logger.info("start batch table update")
    updateAcceptedCounts()
    updateProblemSolverCounts()

    updateRatedPointSums()
    updateLanguageCount()

    updateGreatSubmissions(First)
    updateGreatSubmissions(Fastest)
    updateGreatSubmissions(Shortest)

    updateUserProblemCount(FirstSubmissionCount)
    updateUserProblemCount(FastestSubmissionCount)
    updateUserProblemCount(ShortestSubmissionCount)

    logger.info("finished batch table update")
  }

  /**
    * rewrite accepted count ranking table
    */
  private def updateAcceptedCounts(): Unit = {
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
  private def updateProblemSolverCounts(): Unit = {
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

  /**
    * update user rated point sum
    */
  private def updateRatedPointSums(): Unit = {
    logger.info("updating user rated point sum")
    val points = Point.syntax("points")
    val submissions = Submission.syntax("submissions")
    val userIdColumn = sqls"user_id"
    val columns = RatedPointSum.column

    DB.localTx { implicit session =>
      withSQL {
        deleteFrom(RatedPointSum)
      }.execute().apply()
      withSQL {
        insertInto(RatedPointSum)
          .columns(columns.pointSum, columns.userId)
          .select(sqls"sum(point)", userIdColumn) {
            _.from {
              select(
                sqls"distinct(${submissions.userId}, ${submissions.problemId})",
                points.point,
                submissions.userId
              ).from(Submission as submissions)
                .join(Point as points)
                .on(submissions.problemId, points.problemId)
                .where
                .eq(submissions.c("result"), SubmissionStatus.Accepted)
                .and
                .isNotNull(points.point)
                .and
                .notLike(submissions.userId, "vjudge_")
                .as(SubQuery.syntax("sub").include(points, submissions))
            }.groupBy(userIdColumn)
          }
      }.update().apply()
    }
  }

  private def updateLanguageCount(): Unit = {
    logger.info("updating language count...")
    val columns = LanguageCount.column
    val submissions = Submission.syntax("submissions")
    val userId = sqls"user_id"
    val language = sqls"simplified_language"
    val problemId = sqls"problem_id"
    DB.localTx { implicit session =>
      withSQL {
        deleteFrom(LanguageCount)
      }.execute().apply()
      withSQL {
        insertInto(LanguageCount)
          .columns(columns.userId, columns.simplifiedLanguage, columns.problemCount)
          .select(userId, language, count(distinct(problemId)))(_.from {
            select(
              sqls"regexp_replace(language, '((?<!Perl)\d*|) \(.*\)', '') AS $language",
              userId,
              problemId
            ).from(Submission as submissions)
              .where
              .eq(submissions.c("result"), SubmissionStatus.Accepted)
              .as(SubQuery.syntax("sub").include(submissions))
          }.groupBy(language, userId))
      }.update().apply()
    }
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

  private def updateUserProblemCount[T](support: UserCountPairSupportWithParent[_, T]): Unit = {
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
    * insert records to SQL
    *
    * @param support support object of inserting records
    * @param records seq of records to insert
    * @tparam T type of records
    */
  override def batchInsert[T](support: SQLSelectInsertSupport[T], records: T*): Unit =
    this.synchronized {
      Try {
        DB.localTx { implicit session =>
          val mapping = support.createMapping(records)
          withSQL {
            insertInto(support)
              .namedValues(mapping.columnMappings: _*)
              .append(mapping.onConflictDoUpdate)
          }.batch(mapping.conflictParams: _*).apply()
        }
      }.recover {
        case e: Throwable =>
          logger.catching(e)
          records.foreach(t => logger.error(t.toString))
      }
    }
}

private object SqlUpdater {
  def concat(columns: SQLSyntax*): SQLSyntax = sqls"concat(${sqls.csv(columns: _*)})"
}
