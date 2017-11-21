package com.kenkoooo.atcoder.model

import com.kenkoooo.atcoder.common.TypeAnnotations.UserId
import com.kenkoooo.atcoder.db.SQLInsertSelectSupport
import scalikejdbc.{ParameterBinder, WrappedResultSet}

trait UserCountPair {
  def userId: UserId

  def problemCount: Int
}

trait UserCountPairSupport[T <: UserCountPair] extends SQLInsertSelectSupport[T] {
  override def apply(resultName: scalikejdbc.ResultName[T])(rs: WrappedResultSet): T = {
    apply(userId = rs.string(resultName.userId), problemCount = rs.int(resultName.problemCount))
  }

  def apply(userId: UserId, problemCount: Int): T

  override def createMapping(seq: Seq[T]): Seq[Seq[(scalikejdbc.SQLSyntax, ParameterBinder)]] = {
    val column = this.column
    seq.map { t =>
      Seq(column.userId -> t.userId, column.problemCount -> t.problemCount)
    }
  }
}

case class ShortestSubmissionCount(userId: UserId, problemCount: Int) extends UserCountPair

object ShortestSubmissionCount extends UserCountPairSupport[ShortestSubmissionCount] {
  override protected def definedTableName = "shortest_submission_count"
}
