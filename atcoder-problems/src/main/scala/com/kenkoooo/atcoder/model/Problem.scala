package com.kenkoooo.atcoder.model

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport
import com.kenkoooo.atcoder.common.TypeAnnotations.{ContestId, ProblemId}
import com.kenkoooo.atcoder.db.SQLInsertSelectSupport
import scalikejdbc._
import spray.json.{DefaultJsonProtocol, RootJsonFormat}

case class Problem(id: ProblemId, contestId: ContestId, title: String)

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

trait ProblemJsonSupport extends SprayJsonSupport with DefaultJsonProtocol {
  implicit val problemFormat: RootJsonFormat[Problem] =
    jsonFormat(Problem.apply, "id", "contest_id", "title")
}
