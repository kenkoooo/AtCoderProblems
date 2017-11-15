package com.kenkoooo.db

import scalikejdbc._

trait SQLInsertSelectSupport[T] extends SQLSyntaxSupport[T] {

  def apply(s: SyntaxProvider[T])(rs: WrappedResultSet): T = apply(s.resultName)(rs)

  def apply(resultName: ResultName[T])(rs: WrappedResultSet): T

  def batchColumnMapping: Seq[(SQLSyntax, ParameterBinder)]

  def createParams(seq: Seq[T]): Seq[Seq[Any]]
}
