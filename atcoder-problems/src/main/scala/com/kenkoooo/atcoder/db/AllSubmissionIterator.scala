package com.kenkoooo.atcoder.db

import com.kenkoooo.atcoder.model.Submission

class AllSubmissionIterator(sqlClient: SqlClient, limit: Int = 1000) extends Iterator[Submission] {

  private var currentId: Long = 0
  private var currentList = List[Submission]()

  override def hasNext: Boolean = this.synchronized {
    if (currentList.isEmpty) {
      reload()
    }
    currentList.nonEmpty
  }

  override def next(): Submission = this.synchronized {
    require(hasNext)
    val head = currentList.head
    currentId = head.id
    currentList = currentList.tail
    head
  }

  private def reload(): Unit = this.synchronized {
    currentList = sqlClient.loadSubmissionsGreaterThan(currentId, limit)
  }
}
