package com.kenkoooo.atcoder.common

import java.util.concurrent.{Executors, TimeUnit}

import ScheduledExecutorServiceExtension._
import org.scalatest.{FunSuite, Matchers}

class ScheduledExecutorServiceExtensionTest extends FunSuite with Matchers {
  test("log crashed command") {
    val service = Executors.newSingleThreadScheduledExecutor()

    var x = 0
    service.tryAtFixedDelay(0, 1, TimeUnit.SECONDS) {
      // a job that will be crashed after 2 seconds
      x += 1
      require(x != 2)
    }

    Thread.sleep(3000)
    service.isShutdown shouldBe false
    service.shutdown()
  }
}
