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
