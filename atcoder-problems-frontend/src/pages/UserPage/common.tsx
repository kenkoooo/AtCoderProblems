import { List, Map as ImmutableMap } from "immutable";
import { caseInsensitiveUserId, isAccepted } from "../../utils";
import { ProblemId } from "../../interfaces/Status";
import Submission from "../../interfaces/Submission";

export const userSubmissions = (
  submissionsMap: ImmutableMap<ProblemId, List<Submission>>,
  userId: string
): Submission[] =>
  submissionsMap
    .valueSeq()
    .flatMap((list) => list)
    .filter((s) => caseInsensitiveUserId(s.user_id) === userId)
    .toArray();

export const solvedProblemIds = (
  submissions: ImmutableMap<ProblemId, List<Submission>>
): ProblemId[] =>
  submissions
    .entrySeq()
    .filter(([, submissionList]) =>
      submissionList.find((submission) => isAccepted(submission.result))
    )
    .map(([problemId]) => problemId)
    .toArray();
