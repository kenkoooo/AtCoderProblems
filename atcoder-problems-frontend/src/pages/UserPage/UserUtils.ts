import { caseInsensitiveUserId, isAccepted } from "../../utils";
import { ProblemId } from "../../interfaces/Status";
import Submission from "../../interfaces/Submission";

export const userSubmissions = (
  submissionsMap: Map<ProblemId, Submission[]>,
  userId: string
): Submission[] =>
  Array.from(submissionsMap.values())
    .flatMap((list) => list)
    .filter((s) => caseInsensitiveUserId(s.user_id) === userId);

export const solvedProblemIds = (
  submissions: Map<ProblemId, Submission[]>
): ProblemId[] =>
  Array.from(submissions.entries())
    .filter(([, submissionList]) =>
      submissionList.find((submission) => isAccepted(submission.result))
    )
    .map(([problemId]) => problemId);
