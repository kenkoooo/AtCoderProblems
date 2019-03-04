package com.kenkoooo.atcoder.db
import java.util.concurrent.TimeUnit

import com.kenkoooo.atcoder.db.traits.ContestLoader
import com.kenkoooo.atcoder.model.Contest
import org.mockito.Mockito
import org.scalatest.mockito.MockitoSugar
import org.scalatest.{FunSuite, Matchers}

import scala.concurrent.duration.Duration

class RecentContestLoaderTest extends FunSuite with Matchers with MockitoSugar {
  test("load recent contests") {
    val duration1 = 100
    val duration2 = 1000
    val loader = mock[ContestLoader]
    Mockito
      .when(loader.loadContest())
      .thenReturn(List(Contest("id1", 0, duration1, "", ""), Contest("id2", 0, duration2, "", "")))
    new RecentContestLoader(loader, Duration(duration2, TimeUnit.SECONDS))
      .loadContest()
      .size shouldBe 2
    new RecentContestLoader(loader, Duration(duration2 - duration1, TimeUnit.SECONDS))
      .loadContest()
      .size shouldBe 2
    new RecentContestLoader(loader, Duration(duration2 - duration1 - 1, TimeUnit.SECONDS))
      .loadContest()
      .size shouldBe 1
    new RecentContestLoader(loader, Duration(0, TimeUnit.SECONDS))
      .loadContest()
      .size shouldBe 1
  }
}
