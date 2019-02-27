package com.kenkoooo.atcoder.db.traits
import com.kenkoooo.atcoder.db.SQLSelectInsertSupport

trait SqlInsert {

  /**
    * insert records to SQL
    *
    * @param support support object of inserting records
    * @param records seq of records to insert
    * @tparam T type of records
    */
  def batchInsert[T](support: SQLSelectInsertSupport[T], records: T*): Unit
}
