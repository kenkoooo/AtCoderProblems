import { ProblemId, UserId } from "../../../../interfaces/Status";
import Submission from "../../../../interfaces/Submission";
import { groupBy } from "../../../../utils/GroupBy";
import {
  ReducedProblemResult,
  reduceUserContestResult,
} from "./ResultCalcUtil";

export const getResultsByUserMap = (
  submissions: Submission[],
  userIds: string[],
  pointOverride: (problemId: string) => number | undefined
) => {
  const submissionByUserId = groupBy(
    submissions.filter((s) => s.result !== "CE"),
    (s) => s.user_id
  );

  const resultsByUser = new Map<UserId, Map<ProblemId, ReducedProblemResult>>();
  userIds.forEach((userId) => {
    const userSubmissions = submissionByUserId.get(userId) ?? [];
    const userMap = reduceUserContestResult(userSubmissions, pointOverride);
    resultsByUser.set(userId, userMap);
  });
  return resultsByUser;
};

export function compareProblem<T extends { id: string; order: number | null }>(
  a: T,
  b: T
): number {
  if (a.order !== null && b.order !== null) {
    return a.order - b.order;
  }
  return a.id.localeCompare(b.id);
}
