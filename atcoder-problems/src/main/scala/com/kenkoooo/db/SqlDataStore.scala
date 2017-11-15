package com.kenkoooo.db

import com.kenkoooo.model.{Contest, Problem, Submission}
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

  def submission: Map[Long, Submission] = _submissions

  def reloadSubmissions(): Unit = {
    _submissions = reload(Submission).map(s => s.id -> s).toMap
    _contests = reload(Contest).map(s => s.id -> s).toMap
    _problems = reload(Problem).map(s => s.id -> s).toMap
  }

  def reload[T](support: SQLInsertSelectSupport[T]): Seq[T] = {
    DB.readOnly { implicit session =>
      val s = support.syntax("s")
      withSQL(select.from(support as s))
        .map(support(s))
        .list()
        .apply()
    }
  }

  def insert[T](inserting: T, support: SQLInsertSelectSupport[T]): Unit = {
    DB.localTx { implicit session =>
      applyUpdate {
        insertInto(support)
          .namedValues(support.columnMapping(inserting): _*)
          .onDuplicateKeyUpdate(support.columnMapping(inserting): _*)
      }
    }
  }
}

object SqlDataStore {

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
