package com.kenkoooo.atcoder.db

import com.kenkoooo.atcoder.model.Submission
import scalikejdbc._

/**
  * [[Iterator]] of [[Submission]] to iterate all the submission without expanding all the result to memory
  *
  * @param sqlClient [[SqlClient]] to connect to SQL
  * @param builder   [[SQLBuilder]] of selecting query
  * @param fetchSize the number of records in each fetch
  */
case class SubmissionIterator(sqlClient: SqlClient,
                              builder: SQLBuilder[_],
                              fetchSize: Int = SubmissionIterator.DefaultLimit)
    extends Iterator[Submission] {
  private var offset = 0
  private var currentList = List[Submission]()

  override def hasNext: Boolean = this.synchronized {
    if (currentList.isEmpty) {
      reload()
    }
    currentList.nonEmpty
  }

  override def next(): Submission = this.synchronized {
    require(currentList.nonEmpty)
    val head = currentList.head
    currentList = currentList.tail
    head
  }

  private def reload(): Unit = this.synchronized {
    currentList = sqlClient.executeAndLoadSubmission {
      builder.append(sqls.limit(fetchSize)).append(sqls.offset(offset))
    }
    offset += currentList.size
  }
}

object SubmissionIterator {
  private val DefaultLimit = 100000
}
