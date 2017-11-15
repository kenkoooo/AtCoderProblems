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

  override def batchColumnMapping: Seq[(SQLSyntax, ParameterBinder)] = {
    val p = Problem.column
    Seq(p.id -> sqls.?, p.contestId -> sqls.?, p.title -> sqls.?)
  }

  override def createParams(seq: Seq[Problem]): Seq[Seq[String]] =
    seq.map(p => Seq(p.id, p.contestId, p.title))
}
