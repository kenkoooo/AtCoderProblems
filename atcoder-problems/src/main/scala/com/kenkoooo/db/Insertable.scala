package com.kenkoooo.db

import scalikejdbc._
import Insertable._

trait Insertable[T] extends SQLSyntaxSupport[T] {
  def columnMapping(insertingRecord: T): Seq[(SQLSyntax, ParameterBinder)]

  def apply(s: SyntaxProvider[T])(rs: WrappedResultSet): T = apply(s.resultName)(rs)

  def apply(row: ResultName[T])(rs: WrappedResultSet): T

  def buildInsertOperation(insertingRecord: T): SQLBuilder[UpdateOperation] = {
    insertInto(this)
      .namedValues(columnMapping(insertingRecord): _*)
      .onDuplicateKeyUpdate(columnMapping(insertingRecord): _*)
  }

}

object Insertable {

  implicit class RichInsertSQLBuilder(val self: InsertSQLBuilder) extends AnyVal {
    def onDuplicateKeyUpdate(columnsAndValues: (SQLSyntax, Any)*): InsertSQLBuilder = {
      val cvs = columnsAndValues map {
        case (c, v) => sqls"$c = $v"
      }
      self.append(sqls"on duplicate key update ${sqls.csv(cvs: _*)}")
    }
  }

  implicit class RichSQLSyntax(val self: sqls.type) extends AnyVal {
    def values(column: SQLSyntax): SQLSyntax = sqls"values($column)"
  }

}
