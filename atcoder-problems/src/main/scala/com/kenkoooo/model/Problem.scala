package com.kenkoooo.model

import com.kenkoooo.db.SQLInsertSelectSupport
import scalikejdbc._

case class Problem(id: String, contestId: String, title: String)

object Problem extends SQLInsertSelectSupport[Problem] {

  override val tableName = "problems"

  override def apply(resultName: ResultName[Problem])(rs: WrappedResultSet) = Problem(
    id = rs.string(resultName.id),
    contestId = rs.string(resultName.contestId),
    title = rs.string(resultName.title)
  )

  override def createMapping(seq: Seq[Problem]): Seq[Seq[(SQLSyntax, ParameterBinder)]] = {
    val c = Problem.column
    seq.map(p => Seq(c.id -> p.id, c.contestId -> p.contestId, c.title -> p.title))
  }
}
