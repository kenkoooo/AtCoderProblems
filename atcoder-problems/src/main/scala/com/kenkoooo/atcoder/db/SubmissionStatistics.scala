package com.kenkoooo.atcoder.db

import com.kenkoooo.atcoder.model.Submission
import com.kenkoooo.atcoder.common.TypeAnnotations._

class SubmissionStatistics() {
  private var solvedProblems = Map[UserId, Set[ProblemId]]()
  private var shortestSubmissions = Map[ProblemId, (UserId, SubmissionId, Long)]()

  def update(iterator: Iterator[Submission]): Unit = {
    while (iterator.hasNext) {
      val submission = iterator.next()

    }

  }
}
