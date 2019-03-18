package com.kenkoooo.atcoder.model

import com.kenkoooo.atcoder.common.TypeAnnotations.UserId
import com.kenkoooo.atcoder.db.SQLSelectSupport
import scalikejdbc.WrappedResultSet

case class LanguageCount(userId: UserId, simplifiedLanguage: String, problemCount: Int)

object LanguageCount extends SQLSelectSupport[LanguageCount] {
  override protected def definedTableName: String = "language_count"

  override def apply(
    resultName: scalikejdbc.ResultName[LanguageCount]
  )(rs: WrappedResultSet): LanguageCount = LanguageCount(
    userId = rs.string(resultName.userId),
    simplifiedLanguage = rs.string(resultName.simplifiedLanguage),
    problemCount = rs.int(resultName.problemCount)
  )
}
