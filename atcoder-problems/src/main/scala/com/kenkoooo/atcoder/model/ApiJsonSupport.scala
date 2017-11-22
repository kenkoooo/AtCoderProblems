package com.kenkoooo.atcoder.model

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport
import spray.json.{DefaultJsonProtocol, RootJsonFormat}

trait ApiJsonSupport extends SprayJsonSupport with DefaultJsonProtocol {
  implicit val contestFormat: RootJsonFormat[Contest] =
    jsonFormat(Contest.apply, "id", "start_epoch_second", "duration_second", "title", "rate_change")
  implicit val problemFormat: RootJsonFormat[Problem] =
    jsonFormat(Problem.apply, "id", "contest_id", "title")
  implicit val submissionFormat: RootJsonFormat[Submission] = jsonFormat(
    Submission.apply,
    "id",
    "epoch_second",
    "problem_id",
    "user_id",
    "language",
    "point",
    "length",
    "result",
    "execution_time"
  )
  implicit val firstSubmissionCountFormat: RootJsonFormat[FirstSubmissionCount] =
    jsonFormat(FirstSubmissionCount.apply, "user_id", "problem_count")
  implicit val fastestSubmissionCountFormat: RootJsonFormat[FastestSubmissionCount] =
    jsonFormat(FastestSubmissionCount.apply, "user_id", "problem_count")
  implicit val shortestSubmissionCountFormat: RootJsonFormat[ShortestSubmissionCount] =
    jsonFormat(ShortestSubmissionCount.apply, "user_id", "problem_count")
  implicit val acceptedCountFormat: RootJsonFormat[AcceptedCount] =
    jsonFormat(AcceptedCount.apply, "user_id", "problem_count")

}
