package com.kenkoooo.atcoder

import com.kenkoooo.atcoder.common.Configure
import org.apache.logging.log4j.scala.Logging

import scala.util.{Failure, Success}

object ApiServerMain extends Logging {
  def main(args: Array[String]): Unit = {
    Configure(args(0)) match {
      case Success(config) =>
        val port = config.server.port
      case Failure(e) => logger.catching(e)
    }
  }
}
