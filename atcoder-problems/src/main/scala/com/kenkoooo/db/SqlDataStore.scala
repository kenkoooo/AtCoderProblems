package com.kenkoooo.db

import com.kenkoooo.model.Submission
import scalikejdbc._

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

  def submission: Map[Long, Submission] = _submissions

  def reloadSubmissions(): Unit = {
    _submissions = DB
      .readOnly { implicit session =>
        val s = Submission.syntax("s")
        withSQL(select.from(Submission as s))
          .map(Submission(s))
          .list()
          .apply()
          .map { submission =>
            submission.id -> submission
          }
          .toMap
      }
  }

  def insert[T](insertingRecord: T, support: Insertable[T]): Unit = {
    DB.localTx { implicit session =>
      applyUpdate { support.buildInsertOperation(insertingRecord) }
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
