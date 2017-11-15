package com.kenkoooo.model

import com.kenkoooo.db.SQLInsertSelectSupport
import scalikejdbc._

case class Contest(id: String, startEpochSecond: Long, durationSecond: Long)

object Contest extends SQLInsertSelectSupport[Contest] {

  override val tableName = "contests"

  override def columnMapping(t: Contest): Seq[(SQLSyntax, ParameterBinder)] = {
    val p = Contest.column
    Seq(
      p.id -> t.id,
      p.startEpochSecond -> t.startEpochSecond,
      p.durationSecond -> t.durationSecond
    )
  }

  override def apply(resultName: ResultName[Contest])(rs: WrappedResultSet): Contest = Contest(
    id = rs.string(resultName.id),
    startEpochSecond = rs.long(resultName.startEpochSecond),
    durationSecond = rs.long(resultName.durationSecond)
  )
}
