package com.kenkoooo.atcoder.db

import com.kenkoooo.atcoder.model.{Contest, Problem, Submission}
import scalikejdbc._
import SqlDataStore._

/**
  * Data Store of SQL
  *
  * @param url      JDBC url of SQL
  * @param user     username of SQL
  * @param password password of SQL
  * @param driver   driver name to connect to SQL
  */
class SqlDataStore(url: String,
                   user: String,
                   password: String,
                   driver: String = "com.mysql.cj.jdbc.Driver") {
  Class.forName(driver)
  ConnectionPool.singleton(url, user, password)

  private var _submissions: Map[Long, Submission] = Map()
  private var _contests: Map[String, Contest] = Map()
  private var _problems: Map[String, Problem] = Map()

  def submissions: Map[Long, Submission] = _submissions

  def contests: Map[String, Contest] = _contests

  def problems: Map[String, Problem] = _problems

  def reloadRecords(): Unit = {
    _submissions = reload(Submission).map(s => s.id -> s).toMap
    _contests = reload(Contest).map(s => s.id -> s).toMap
    _problems = reload(Problem).map(s => s.id -> s).toMap
  }

  private def reload[T](support: SQLInsertSelectSupport[T]): Seq[T] = {
    DB.readOnly { implicit session =>
      val s = support.syntax("s")
      withSQL(select.from(support as s))
        .map(support(s))
        .list()
        .apply()
    }
  }

  def batchInsert[T](support: SQLInsertSelectSupport[T], records: T*): Unit = this.synchronized {
    DB.localTx { implicit session =>
      val params = support.createMapping(records).map(seq => seq.map(_._2)).map(seq => seq ++ seq)
      val columnMapping = support.createMapping(records).head.map(_._1 -> sqls.?)
      withSQL {
        insertInto(support)
          .namedValues(columnMapping: _*)
          .onDuplicateKeyUpdate(columnMapping: _*)
      }.batch(params: _*).apply()
    }
  }
}

private object SqlDataStore {

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
