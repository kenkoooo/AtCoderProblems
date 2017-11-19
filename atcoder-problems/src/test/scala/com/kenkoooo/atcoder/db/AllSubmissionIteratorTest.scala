package com.kenkoooo.atcoder.db

import com.kenkoooo.atcoder.model.Submission
import org.mockito.{ArgumentMatchers, Mockito}
import org.scalatest.mockito.MockitoSugar
import org.scalatest.{FunSuite, Matchers}

class AllSubmissionIteratorTest extends FunSuite with Matchers with MockitoSugar {
  test("check next() and hasNext") {
    val submission1 = mock[Submission]
    Mockito.when(submission1.id).thenReturn(1)
    val submission2 = mock[Submission]
    Mockito.when(submission2.id).thenReturn(2)
    val submission3 = mock[Submission]
    Mockito.when(submission3.id).thenReturn(3)

    val sql = mock[SqlClient]
    Mockito
      .when(sql.loadSubmissionsGreaterThan(ArgumentMatchers.anyLong(), ArgumentMatchers.anyInt()))
      .thenReturn(List[Submission]())
    Mockito.when(sql.loadSubmissionsGreaterThan(0, 2)).thenReturn(List(submission1, submission2))
    Mockito.when(sql.loadSubmissionsGreaterThan(2, 2)).thenReturn(List(submission3))

    val allSubmissions = new AllSubmissionIterator(sql, 2)

    allSubmissions.hasNext shouldBe true
    allSubmissions.next().id shouldBe 1
    allSubmissions.hasNext shouldBe true
    allSubmissions.next().id shouldBe 2
    allSubmissions.hasNext shouldBe true
    allSubmissions.next().id shouldBe 3
    allSubmissions.hasNext shouldBe false
  }
}
