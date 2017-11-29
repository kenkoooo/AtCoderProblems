package com.kenkoooo.atcoder.common

import java.util.concurrent.{ScheduledExecutorService, ScheduledFuture, TimeUnit}

import org.apache.logging.log4j.scala.Logging

import scala.util.Try

object ScheduledExecutorServiceExtension extends Logging {

  implicit class TryAndDieScheduledExecutorService(val self: ScheduledExecutorService)
      extends AnyVal {

    /**
      * Creates and executes a periodic action.
      * When the given crashed, the service will be shut downed immediately and thrown exception will be caught by the logger.
      *
      * @param initialDelay the time to delay first execution
      * @param period       the period between successive executions
      * @param unit         the time unit of the initialDelay and period parameters
      * @param command      the task to execute
      * @return a [[ScheduledFuture]] representing pending completion of the task
      */
    def tryAtFixedDelay(initialDelay: Long, period: Long, unit: TimeUnit)(
      command: => Unit
    ): ScheduledFuture[_] = {
      self.scheduleWithFixedDelay(
        () =>
          Try {
            command
          }.recover {
            case e: Throwable =>
              logger.catching(e)
              self.shutdownNow()
        },
        initialDelay,
        period,
        unit
      )
    }
  }

}
