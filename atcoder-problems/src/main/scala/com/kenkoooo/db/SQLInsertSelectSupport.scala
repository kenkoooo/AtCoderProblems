package com.kenkoooo.db

import scalikejdbc._

trait SQLInsertSelectSupport[T] extends SQLSyntaxSupport[T] {
  def columnMapping(t: T): Seq[(SQLSyntax, ParameterBinder)]

  def apply(s: SyntaxProvider[T])(rs: WrappedResultSet): T = apply(s.resultName)(rs)

  def apply(resultName: ResultName[T])(rs: WrappedResultSet): T
}
