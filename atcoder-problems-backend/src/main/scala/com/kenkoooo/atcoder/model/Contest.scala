package com.kenkoooo.atcoder.model

import com.kenkoooo.atcoder.common.TypeAnnotations.ContestId
import com.kenkoooo.atcoder.db.SQLSelectInsertSupport
import scalikejdbc._

/**
  * data class for contests
  *
  * @param id               contest id
  * @param startEpochSecond contest start time (unix seconds)
  * @param durationSecond   contest duration seconds
  * @param title            contest title
  * @param rateChange       description about changes of rating
  */
case class Contest(id: ContestId,
                   startEpochSecond: Long,
                   durationSecond: Long,
                   title: String,
                   rateChange: String)

object Contest extends SQLSelectInsertSupport[Contest] {

  override val definedTableName = "contests"

  override def apply(resultName: ResultName[Contest])(rs: WrappedResultSet): Contest = Contest(
    id = rs.string(resultName.id),
    startEpochSecond = rs.long(resultName.startEpochSecond),
    durationSecond = rs.long(resultName.durationSecond),
    title = rs.string(resultName.title),
    rateChange = rs.string(resultName.rateChange)
  )

  override def createMapping(seq: Seq[Contest]): Seq[Seq[(SQLSyntax, ParameterBinder)]] = {
    val p = Contest.column
    seq.map(
      c =>
        Seq(
          p.id -> c.id,
          p.startEpochSecond -> c.startEpochSecond,
          p.durationSecond -> c.durationSecond,
          p.title -> c.title,
          p.rateChange -> c.rateChange
      )
    )
  }
}
