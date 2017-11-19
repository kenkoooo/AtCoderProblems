package com.kenkoooo.atcoder.db

import com.kenkoooo.atcoder.common.TypeAnnotations._

class SubmissionStatistics(sqlClient: SqlClient) {
  private var solvedProblems = Map[UserId, Set[ProblemId]]()
  private var shortestSubmissions = Map[ProblemId, (UserId, SubmissionId, Long)]()

  def update(): Unit = {
    sqlClient.loadAllAcceptedSubmissions().foreach { submission =>
      }
  }

}
