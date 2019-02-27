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

case class Mapping(primaryKey: Seq[(SQLSyntax, ParameterBinder)],
                   map: Seq[Seq[(SQLSyntax, ParameterBinder)]]) {
  def columnMappings: Seq[(SQLSyntax, ParameterBinder)] =
    primaryKey.zip(map).map(row => row._1 +: row._2).head
  def params: Seq[Seq[ParameterBinder]] = {
    primaryKey.zip(map).map(each => each._1 +: each._2).map(seq => seq.map(_._2))
  }
  def onConflictDoUpdate: SQLSyntax =
    sqls"ON CONFLICT (${primaryKey.head._1}) DO UPDATE SET ${sqls.csv(map.head.map(each => sqls"${each._1} = ?"): _*)}"
  def conflictParams: Seq[Seq[ParameterBinder]] =
    params.zip(map.map(seq => seq.map(_._2))).map(each => each._1 ++ each._2)

}

trait SQLInsertSupport[T] {
  def createMapping(seq: Seq[T]): Mapping
}

trait SQLSelectInsertSupport[T] extends SQLSelectSupport[T] with SQLInsertSupport[T]
