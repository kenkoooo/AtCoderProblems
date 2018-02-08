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
    "contest_id",
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
  implicit val mergedProblemFormat: RootJsonFormat[MergedProblem] =
    jsonFormat(
      MergedProblem.apply,
      "id",
      "contest_id",
      "title",
      "fastest_submission_id",
      "fastest_user_id",
      "fastest_contest_id",
      "execution_time",
      "first_submission_id",
      "first_user_id",
      "first_contest_id",
      "shortest_submission_id",
      "shortest_user_id",
      "shortest_contest_id",
      "source_code_length",
      "solver_count",
      "point",
      "predict"
    )
  implicit val ratedPointSumFormat: RootJsonFormat[RatedPointSum] =
    jsonFormat(RatedPointSum.apply, "user_id", "point_sum")
  implicit val languageCountFormat: RootJsonFormat[LanguageCount] =
    jsonFormat(LanguageCount.apply, "user_id", "language", "count")
  implicit val predictedRatingFormat: RootJsonFormat[PredictedRating] =
    jsonFormat(PredictedRating.apply, "user_id", "rating")
}
