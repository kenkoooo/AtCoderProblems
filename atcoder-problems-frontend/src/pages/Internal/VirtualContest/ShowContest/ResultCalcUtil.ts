import { ProblemId } from "../../../../interfaces/Status";
import { isAccepted } from "../../../../utils";

export interface ReducedProblemResult {
  readonly trials: number;
  readonly penalties: number;
  readonly accepted: boolean;
  readonly point: number;
  readonly lastUpdatedEpochSecond: number;
}

export function reduceUserContestResult<
  S extends {
    id: number;
    result: string;
    problem_id: string;
    point: number;
    epoch_second: number;
  }
>(
  submissions: S[],
  pointOverride:
    | ((problemId: string) => number | undefined)
    | undefined = undefined
) {
  const result = new Map<ProblemId, ReducedProblemResult>();
  submissions
    .sort((a, b) => a.id - b.id)
    .forEach((submission) => {
      const accepted = isAccepted(submission.result);
      const problemId = submission.problem_id;

      const overrideMaxPoint = pointOverride
        ? pointOverride(problemId)
        : undefined;
      const overridePoint =
        overrideMaxPoint !== undefined
          ? accepted
            ? overrideMaxPoint
            : 0
          : undefined;
      const point =
        overridePoint !== undefined ? overridePoint : submission.point;

      const currentBest = result.get(submission.problem_id);
      const lastUpdatedEpochSecond = submission.epoch_second;
      if (currentBest) {
        if (currentBest.point < point) {
          result.set(problemId, {
            trials: currentBest.trials + 1,
            accepted: accepted || currentBest.accepted,
            point,
            penalties: currentBest.trials,
            lastUpdatedEpochSecond,
          });
        } else {
          result.set(problemId, {
            ...currentBest,
            trials: currentBest.trials + 1,
          });
        }
      } else {
        result.set(problemId, {
          trials: 1,
          accepted,
          point,
          penalties: 0,
          lastUpdatedEpochSecond,
        });
      }
    });
  return result;
}

export interface UserTotalResult {
  readonly penalties: number;
  readonly point: number;
  readonly lastUpdatedEpochSecond: number;
}

export const compareTotalResult = (
  aResult: UserTotalResult,
  bResult: UserTotalResult
) => {
  const aPoint = aResult.point;
  const bPoint = bResult.point;
  if (aPoint !== bPoint) {
    return bPoint - aPoint;
  }

  const aSecond = aResult.lastUpdatedEpochSecond;
  const bSecond = bResult.lastUpdatedEpochSecond;
  if (aSecond !== bSecond) {
    return aSecond - bSecond;
  }

  const aPenalties = aResult.penalties;
  const bPenalties = bResult.penalties;
  return aPenalties - bPenalties;
};

export const calcUserTotalResult = (
  userResult: Map<ProblemId, ReducedProblemResult>
): UserTotalResult => {
  let penalties = 0;
  let point = 0;
  let lastUpdatedEpochSecond = 0;
  userResult.forEach((reducedProblemResult) => {
    point += reducedProblemResult.point;
    penalties += reducedProblemResult.penalties;

    if (reducedProblemResult.point) {
      lastUpdatedEpochSecond = Math.max(
        reducedProblemResult.lastUpdatedEpochSecond,
        lastUpdatedEpochSecond
      );
    }
  });
  return {
    penalties,
    point,
    lastUpdatedEpochSecond,
  };
};
