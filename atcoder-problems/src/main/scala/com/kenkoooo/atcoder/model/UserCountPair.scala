package com.kenkoooo.atcoder.model

import com.kenkoooo.atcoder.common.TypeAnnotations.UserId
import com.kenkoooo.atcoder.db.SQLSelectSupport
import scalikejdbc.WrappedResultSet

trait UserCountPair {
  def userId: UserId

  def problemCount: Int
}

trait UserCountPairSupport[T <: UserCountPair, P] extends SQLSelectSupport[T] {
  override def apply(resultName: scalikejdbc.ResultName[T])(rs: WrappedResultSet): T = {
    apply(userId = rs.string(resultName.userId), problemCount = rs.int(resultName.problemCount))
  }

  def apply(userId: UserId, problemCount: Int): T

  def parentSupport: SQLSelectSupport[P]
}

case class ShortestSubmissionCount(userId: UserId, problemCount: Int) extends UserCountPair

object ShortestSubmissionCount extends UserCountPairSupport[ShortestSubmissionCount, Shortest] {
  override protected def definedTableName = "shortest_submission_count"

  override def parentSupport: Shortest.type = Shortest
}

case class FastestSubmissionCount(userId: UserId, problemCount: Int) extends UserCountPair

object FastestSubmissionCount extends UserCountPairSupport[FastestSubmissionCount, Fastest] {
  override def parentSupport: Fastest.type = Fastest

  override protected def definedTableName = "fastest_submission_count"
}

case class FirstSubmissionCount(userId: UserId, problemCount: Int) extends UserCountPair
object FirstSubmissionCount extends UserCountPairSupport[FirstSubmissionCount, First] {
  override def parentSupport: First.type = First

  override protected def definedTableName = "first_submission_count"
}
