package com.kenkoooo.model

import com.kenkoooo.db.SQLInsertSelectSupport
import scalikejdbc._

case class Problem(id: String, contestId: String, title: String)

object Problem extends SQLInsertSelectSupport[Problem] {

  override val tableName = "problems"

  override def columnMapping(t: Problem): Seq[(SQLSyntax, ParameterBinder)] = {
    val p = Problem.column
    Seq(p.id -> t.id, p.contestId -> t.contestId, p.title -> t.title)
  }

  override def apply(resultName: ResultName[Problem])(rs: WrappedResultSet) = Problem(
    id = rs.string(resultName.id),
    contestId = rs.string(resultName.contestId),
    title = rs.string(resultName.title)
  )
}
