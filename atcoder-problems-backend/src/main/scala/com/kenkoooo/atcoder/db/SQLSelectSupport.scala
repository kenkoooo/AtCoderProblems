package com.kenkoooo.atcoder.db

import scalikejdbc._

/**
  * trait of records which can be inserted into and selected from SQL
  *
  * @tparam T type of record to insert into SQL
  */
trait SQLSelectSupport[T] extends SQLSyntaxSupport[T] {
  override def tableName: String = definedTableName

  protected def definedTableName: String

  def apply(s: SyntaxProvider[T])(rs: WrappedResultSet): T = apply(s.resultName)(rs)

  def apply(resultName: ResultName[T])(rs: WrappedResultSet): T
}

trait SQLInsertSupport[T] {
  def createMapping(seq: Seq[T]): Seq[Seq[(SQLSyntax, ParameterBinder)]]
}

trait SQLSelectInsertSupport[T] extends SQLSelectSupport[T] with SQLInsertSupport[T]
