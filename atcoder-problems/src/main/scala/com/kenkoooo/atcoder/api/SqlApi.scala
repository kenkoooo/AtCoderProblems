package com.kenkoooo.atcoder.api

import akka.http.scaladsl.model.DateTime
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import com.kenkoooo.atcoder.db.SqlClient
import com.kenkoooo.atcoder.model.ApiJsonSupport
import com.kenkoooo.atcoder.scraper.AtCoder.UserNameRegex

class SqlApi(sqlClient: SqlClient) extends ApiJsonSupport {
  val routes: Route = get {
    pathPrefix("info") {
      conditional(EntityTagger.calculateDateTimeTag(lastUpdated()), lastUpdated()) {
        path("contests") {
          complete(sqlClient.contests.values.toList)
        } ~ path("problems") {
          complete(sqlClient.problems.values.toList)
        } ~ path("ac") {
          complete(sqlClient.acceptedCounts.toList)
        } ~ path("fast") {
          complete(sqlClient.fastestSubmissionCounts.toList)
        } ~ path("first") {
          complete(sqlClient.firstSubmissionCounts.toList)
        } ~ path("short") {
          complete(sqlClient.shortestSubmissionCounts.toList)
        }
      }
    } ~ path("results") {
      parameters('user ? "", 'rivals ? "") { (user, rivals) =>
        val rivalList = rivals.split(",").map(_.trim).toList
        val users = (user :: rivalList).filter(_.length > 0).filter(_.matches(UserNameRegex))

        complete(sqlClient.loadUserSubmissions(users: _*).toList)
      }
    }
  }

  private def lastUpdated(): DateTime = DateTime(sqlClient.lastReloadedTimeMillis)
}
