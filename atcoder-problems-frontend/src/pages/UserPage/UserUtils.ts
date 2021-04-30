import { isAccepted } from "../../utils";
import { ProblemId } from "../../interfaces/Status";
import Submission from "../../interfaces/Submission";

export const solvedProblemIds = (
  submissions: Map<ProblemId, Submission[]>
): ProblemId[] =>
  Array.from(submissions.entries())
    .filter(([, submissionList]) =>
      submissionList.find((submission) => isAccepted(submission.result))
    )
    .map(([problemId]) => problemId);

export const solvedProblemIdsFromArray = (submissions: Submission[]) => {
  const accepted = submissions.filter((s) => isAccepted(s.result));
  const problemIds = new Set(accepted.map((s) => s.problem_id));
  return Array.from(problemIds);
};

export const rejectedProblemIdsFromArray = (submissions: Submission[]) => {
  const accepted = submissions.filter((s) => isAccepted(s.result));
  const acceptedProblemIds = new Set(accepted.map((s) => s.problem_id));

  const rejected = submissions.filter((s) => !isAccepted(s.result));
  const rejectedProblemIds = new Set(rejected.map((s) => s.problem_id));

  const difference = new Set(
    Array.from(rejectedProblemIds).filter((e) => !acceptedProblemIds.has(e))
  );

  return Array.from(difference);
};
