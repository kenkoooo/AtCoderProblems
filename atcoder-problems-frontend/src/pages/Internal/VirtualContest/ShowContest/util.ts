import { ProblemId, UserId } from "../../../../interfaces/Status";
import Submission from "../../../../interfaces/Submission";
import { groupBy } from "../../../../utils/GroupBy";
import { VirtualContestItem } from "../../types";
import {
  ReducedProblemResult,
  reduceUserContestResult,
} from "./ResultCalcUtil";

export function getPointOverrideMap<T extends { item: VirtualContestItem }>(
  problems: T[]
) {
  const pointOverrideMap = new Map<ProblemId, number>();
  problems.forEach(({ item }) => {
    const problemId = item.id;
    const point = item.point;
    if (point !== null) {
      pointOverrideMap.set(problemId, point);
    }
  });
  return pointOverrideMap;
}

export const getResultsByUserMap = (
  submissions: Submission[],
  userIds: string[],
  pointOverrideMap: Map<ProblemId, number>
) => {
  const submissionByUserId = groupBy(
    submissions.filter((s) => s.result !== "CE"),
    (s) => s.user_id
  );

  const resultsByUser = new Map<UserId, Map<ProblemId, ReducedProblemResult>>();
  userIds.forEach((userId) => {
    const userSubmissions = submissionByUserId.get(userId) ?? [];
    const userMap = reduceUserContestResult(userSubmissions, (problemId) =>
      pointOverrideMap.get(problemId)
    );
    resultsByUser.set(userId, userMap);
  });
  return resultsByUser;
};
