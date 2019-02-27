package com.kenkoooo.atcoder.model

import com.kenkoooo.atcoder.common.TypeAnnotations.{ContestId, ProblemId}
import com.kenkoooo.atcoder.db.{Mapping, SQLSelectInsertSupport}
import scalikejdbc._

case class Problem(id: ProblemId, contestId: ContestId, title: String)

object Problem extends SQLSelectInsertSupport[Problem] {

  override val definedTableName = "problems"

  override def apply(resultName: ResultName[Problem])(rs: WrappedResultSet) = Problem(
    id = rs.string(resultName.id),
    contestId = rs.string(resultName.contestId),
    title = rs.string(resultName.title)
  )

  override def createMapping(seq: Seq[Problem]): Mapping = {
    val c = Problem.column
    val mapping = seq.map(p => Seq(c.contestId -> p.contestId, c.title -> p.title))
    val key = seq.map(c.id -> _.id)
    Mapping(key, mapping)
  }
}
