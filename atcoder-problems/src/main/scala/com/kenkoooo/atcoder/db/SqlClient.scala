package com.kenkoooo.atcoder.db

import com.kenkoooo.atcoder.model.{Contest, Problem, Submission}
import org.apache.logging.log4j.scala.Logging
import scalikejdbc._
import SqlClient._

import scala.util.Try

/**
  * Data Store of SQL
  *
  * @param url      JDBC url of SQL
  * @param user     username of SQL
  * @param password password of SQL
  * @param driver   driver name to connect to SQL
  */
class SqlClient(url: String,
                user: String,
                password: String,
                driver: String = "com.mysql.cj.jdbc.Driver")
    extends Logging {
  Class.forName(driver)
  ConnectionPool.singleton(url, user, password)

  private var _contests: Map[String, Contest] = Map()
  private var _problems: Map[String, Problem] = Map()
  private var _lastReloaded: Long = 0

  def contests: Map[String, Contest] = _contests

  def problems: Map[String, Problem] = _problems

  def lastReloadedTimeMillis: Long = _lastReloaded

  def experiment: List[(Long, String)] = {
    val s = Submission.syntax("s")
    DB.readOnly { implicit session =>
      withSQL {
        select(s.result.id, s.result.userId).from(Submission as s)
      }.map(rs => (rs.long(s.resultName.id), rs.string(s.resultName.userId))).list().apply()
    }
  }

  /**
    * Load submissions with given ids from SQL
    *
    * @param ids ids of submissions to load
    * @return list of loaded submissions
    */
  def loadSubmissions(ids: Long*): List[Submission] = {
    val s = Submission.syntax("s")
    DB.readOnly { implicit session =>
      withSQL {
        selectFrom(Submission as s).where.in(s.id, ids)
      }.map(Submission(s)).list().apply()
    }
  }

  def reloadRecords(): Unit = {
    _contests = reload(Contest).map(s => s.id -> s).toMap
    _problems = reload(Problem).map(s => s.id -> s).toMap
    _lastReloaded = System.currentTimeMillis()
  }

  private def reload[T](support: SQLInsertSelectSupport[T]): Seq[T] = {
    logger.info(s"reloading $support")
    DB.readOnly { implicit session =>
      val s = support.syntax("s")
      withSQL(select.from(support as s))
        .map(support(s))
        .list()
        .apply()
    }
  }

  def batchInsert[T](support: SQLInsertSelectSupport[T], records: T*): Unit = this.synchronized {
    Try {
      DB.localTx { implicit session =>
        val params = support.createMapping(records).map(seq => seq.map(_._2)).map(seq => seq ++ seq)
        val columnMapping = support.createMapping(records).head.map(_._1 -> sqls.?)
        withSQL {
          insertInto(support)
            .namedValues(columnMapping: _*)
            .onDuplicateKeyUpdate(columnMapping: _*)
        }.batch(params: _*).apply()
      }
    }.recover {
      case e: Throwable =>
        logger.catching(e)
        records.foreach(t => logger.error(t.toString))
    }
  }
}

private object SqlClient {

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
