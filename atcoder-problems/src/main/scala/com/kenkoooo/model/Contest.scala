package com.kenkoooo.model

import com.kenkoooo.db.SQLInsertSelectSupport
import scalikejdbc._

case class Contest(id: String, startEpochSecond: Long, durationSecond: Long)

object Contest extends SQLInsertSelectSupport[Contest] {

  override val tableName = "contests"

  override def apply(resultName: ResultName[Contest])(rs: WrappedResultSet): Contest = Contest(
    id = rs.string(resultName.id),
    startEpochSecond = rs.long(resultName.startEpochSecond),
    durationSecond = rs.long(resultName.durationSecond)
  )

  override def batchColumnMapping: Seq[(SQLSyntax, ParameterBinder)] = {
    val p = Contest.column
    Seq(p.id -> sqls.?, p.startEpochSecond -> sqls.?, p.durationSecond -> sqls.?)
  }

  override def createParams(seq: Seq[Contest]): Seq[Seq[Any]] = {
    seq.map(c => Seq(c.id, c.startEpochSecond, c.durationSecond))
  }
}
