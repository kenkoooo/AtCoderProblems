package com.kenkoooo.atcoder.model

import com.kenkoooo.atcoder.common.TypeAnnotations.{ContestId, ProblemId}
import com.kenkoooo.atcoder.db.SQLSelectInsertSupport
import scalikejdbc._

case class Problem(id: ProblemId, contestId: ContestId, title: String)

object Problem extends SQLSelectInsertSupport[Problem] {

  override val definedTableName = "problems"

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
