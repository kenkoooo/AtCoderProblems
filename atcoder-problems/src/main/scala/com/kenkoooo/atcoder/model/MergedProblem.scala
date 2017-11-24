package com.kenkoooo.atcoder.model

import com.kenkoooo.atcoder.common.TypeAnnotations.{ContestId, ProblemId, SubmissionId, UserId}
import scalikejdbc.WrappedResultSet
import scalikejdbc._

/**
  * [[Problem]] and other information
  *
  * @param id                   Problem ID
  * @param contestId            Contest ID
  * @param title                Problem title
  * @param fastestSubmissionId  id of the fastest submission of this problem
  * @param fastestUserId        user id of the fastest submission of this problem
  * @param executionTime        execution time of the fastest submission of this problem
  * @param firstSubmissionId    id of the first submission of this problem
  * @param firstUserId          user id of the first submission of this problem
  * @param shortestSubmissionId id of the shortest submission of this problem
  * @param shortestUserId       user id of the shortest submission of this problem
  * @param sourceCodeLength     source code length of the shortest submission of this problem
  * @param solverCount          the number of solvers of this problem
  */
case class MergedProblem(id: ProblemId,
                         contestId: ContestId,
                         title: String,
                         fastestSubmissionId: Option[SubmissionId],
                         fastestUserId: Option[UserId],
                         executionTime: Option[Int],
                         firstSubmissionId: Option[SubmissionId],
                         firstUserId: Option[UserId],
                         shortestSubmissionId: Option[SubmissionId],
                         shortestUserId: Option[UserId],
                         sourceCodeLength: Option[Int],
                         solverCount: Int)

object MergedProblem extends SQLSyntaxSupport[MergedProblem] {
  def apply(problem: SyntaxProvider[Problem],
            fastestSubmission: SyntaxProvider[Submission],
            firstSubmission: SyntaxProvider[Submission],
            shortestSubmission: SyntaxProvider[Submission],
            solver: SyntaxProvider[ProblemSolver])(rs: WrappedResultSet): MergedProblem =
    MergedProblem(
      id = rs.string(problem.resultName.id),
      contestId = rs.string(problem.resultName.contestId),
      title = rs.string(problem.resultName.title),
      fastestSubmissionId = rs.longOpt(fastestSubmission.resultName.id),
      fastestUserId = rs.stringOpt(fastestSubmission.resultName.userId),
      executionTime = rs.intOpt(fastestSubmission.resultName.executionTime),
      firstSubmissionId = rs.longOpt(firstSubmission.resultName.id),
      firstUserId = rs.stringOpt(firstSubmission.resultName.userId),
      shortestSubmissionId = rs.longOpt(shortestSubmission.resultName.id),
      shortestUserId = rs.stringOpt(shortestSubmission.resultName.userId),
      sourceCodeLength = rs.intOpt(shortestSubmission.resultName.length),
      solverCount = rs.intOpt(solver.resultName.userCount).getOrElse(0)
    )
}
