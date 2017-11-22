package com.kenkoooo.atcoder.api

import akka.http.scaladsl.model.DateTime
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import com.kenkoooo.atcoder.db.SqlClient
import com.kenkoooo.atcoder.model.{ContestJsonSupport, ProblemJsonSupport}

class SqlApi(sqlClient: SqlClient) extends ContestJsonSupport with ProblemJsonSupport {
  val routes: Route = get {
    pathPrefix("info") {
      conditional(EntityTagger.calculateDateTimeTag(lastUpdated()), lastUpdated()) {
        path("contests") {
          complete(sqlClient.contests.values.toList)
        } ~ path("problems") {
          complete(sqlClient.problems.values.toList)
        }
      }
    }
  }

  private def lastUpdated(): DateTime = DateTime(sqlClient.lastReloadedTimeMillis)
}
