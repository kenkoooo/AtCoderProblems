package com.kenkoooo.atcoder

import akka.actor.ActorSystem
import akka.http.scaladsl.Http
import akka.stream.ActorMaterializer
import com.kenkoooo.atcoder.api.SqlApi
import com.kenkoooo.atcoder.common.Configure
import com.kenkoooo.atcoder.db.SqlClient
import org.apache.logging.log4j.scala.Logging

import scala.util.{Failure, Success}

object ApiServerMain extends Logging {
  implicit val system: ActorSystem = ActorSystem()
  implicit val materializer: ActorMaterializer = ActorMaterializer()

  def main(args: Array[String]): Unit = {
    Configure(args(0)) match {
      case Success(config) =>
        val port = config.server.port

        val sqlClient = new SqlClient(
          url = config.sql.url,
          user = config.sql.user,
          password = config.sql.password
        )
        val api = new SqlApi(sqlClient)

        Http().bindAndHandle(api.routes, interface = "0.0.0.0", port = port)
      case Failure(e) => logger.catching(e)
    }
  }
}
