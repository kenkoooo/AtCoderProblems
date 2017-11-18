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
      * @param command      the task to execute
      * @param initialDelay the time to delay first execution
      * @param period       the period between successive executions
      * @param unit         the time unit of the initialDelay and period parameters
      * @return a [[ScheduledFuture]] representing pending completion of the task
      */
    def scheduleTryJobAtFixedRate(command: Runnable,
                                  initialDelay: Long,
                                  period: Long,
                                  unit: TimeUnit): ScheduledFuture[_] = {
      self.scheduleAtFixedRate(
        () =>
          Try {
            command.run()
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
