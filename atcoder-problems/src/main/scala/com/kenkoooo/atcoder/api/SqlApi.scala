package com.kenkoooo.atcoder.api

import akka.http.scaladsl.model.DateTime
import akka.http.scaladsl.model.headers._
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import com.kenkoooo.atcoder.db.SqlClient
import com.kenkoooo.atcoder.model.ContestJsonSupport

class SqlApi(sqlClient: SqlClient) extends ContestJsonSupport {
  val routes: Route = get {
    path("contests") {
      optionalHeaderValueByName(`If-None-Match`.name) {
        case Some(_) =>
          conditional(EntityTagger.calculateDateTimeTag(lastUpdated()), lastUpdated()) {
            complete(sqlClient.contests.values.toList)
          }
        case None => complete(sqlClient.contests.values.toList)
      }
    }
  }

  private def lastUpdated(): DateTime = DateTime(sqlClient.lastReloadedTimeMillis)
}
