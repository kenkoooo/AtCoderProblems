package com.kenkoooo.atcoder.api

import akka.http.scaladsl.model.DateTime
import akka.http.scaladsl.model.headers.CacheDirectives.`max-age`
import akka.http.scaladsl.model.headers.{`Access-Control-Allow-Origin`, `Cache-Control`}
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import com.kenkoooo.atcoder.db.SqlViewer
import com.kenkoooo.atcoder.model.{ApiJsonSupport, UserInfo}
import com.kenkoooo.atcoder.scraper.AtCoder.UserNameRegex

/**
  * API routes which connect to SQL and provide JSON-formatted API
  *
  * @param sqlClient [[SqlViewer]] to connect to SQL
  */
class JsonApi(sqlClient: SqlViewer) extends ApiJsonSupport {
  val routes: Route = encodeResponse {
    respondWithDefaultHeader(`Access-Control-Allow-Origin`.*) {
      get {
        pathPrefix("info") {
          conditional(EntityTagger.calculateDateTimeTag(lastUpdated()), lastUpdated()) {
            path("contests") {
              complete(sqlClient.loadContest())
            } ~ path("problems") {
              complete(sqlClient.problems.values.toList)
            } ~ path("ac") {
              complete(sqlClient.acceptedCounts)
            } ~ path("fast") {
              complete(sqlClient.fastestSubmissionCounts)
            } ~ path("first") {
              complete(sqlClient.firstSubmissionCounts)
            } ~ path("short") {
              complete(sqlClient.shortestSubmissionCounts)
            } ~ path("merged-problems") {
              complete(sqlClient.mergedProblems)
            } ~ path("sums") {
              complete(sqlClient.ratedPointSums)
            } ~ path("lang") {
              complete(sqlClient.languageCounts)
            } ~ path("predicted-ratings") {
              complete(sqlClient.predictedRatings)
            }
          }
        } ~ path("results") {
          parameters('user ? "", 'rivals ? "") { (user, rivals) =>
            val rivalList = rivals.split(",").map(_.trim).toList
            val users = (user :: rivalList).filter(_.length > 0).filter(_.matches(UserNameRegex))

            val submissionCount: Long = sqlClient.loadUserSubmissionCount(users: _*)
            conditional(EntityTagger.calculateIntegerTag(submissionCount)) {
              respondWithHeaders(`Cache-Control`(`max-age`(0))) {
                complete(sqlClient.loadUserSubmissions(users: _*).toList)
              }
            }
          }
        } ~ pathPrefix("v2") {
          path("user_info") {
            parameters('user ? "") { userId =>
              val (point, pointRank) = sqlClient.pointAndRankOf(userId)
              val (count, countRank) = sqlClient.countAndRankOf(userId)
              val userInfo = UserInfo(
                userId = userId,
                acceptedCount = count,
                acceptedCountRank = countRank,
                ratedPointSum = point,
                ratedPointSumRank = pointRank
              )
              complete(userInfo)
            }
          }
        }
      }
    }
  }

  private def lastUpdated(): DateTime = DateTime(sqlClient.lastReloadedTimeMillis)
}
