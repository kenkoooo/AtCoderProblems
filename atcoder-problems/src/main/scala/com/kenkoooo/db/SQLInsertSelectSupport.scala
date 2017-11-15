package com.kenkoooo.db

import scalikejdbc._

/**
  * trait of records which can be inserted into and selected from SQL
  *
  * @tparam T type of record to insert into SQL
  */
trait SQLInsertSelectSupport[T] extends SQLSyntaxSupport[T] {

  def apply(s: SyntaxProvider[T])(rs: WrappedResultSet): T = apply(s.resultName)(rs)

  def apply(resultName: ResultName[T])(rs: WrappedResultSet): T

  def createMapping(seq: Seq[T]): Seq[Seq[(SQLSyntax, ParameterBinder)]]
}
