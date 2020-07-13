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
>(submissions: S[]) {
  const result = new Map<ProblemId, ReducedProblemResult>();
  submissions
    .sort((a, b) => a.id - b.id)
    .forEach((submission) => {
      const accepted = isAccepted(submission.result);
      const problemId = submission.problem_id;
      const point = submission.point;
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
  penalties: number;
  point: number;
  lastUpdatedEpochSecond: number;
}

export const calcTotalResult = (
  userResult: Map<ProblemId, ReducedProblemResult>
): UserTotalResult => {
  let penalties = 0;
  let point = 0;
  let lastUpdatedEpochSecond = 0;
  Array.from(userResult).map(([, reducedProblemResult]) => {
    point += reducedProblemResult.point;
    penalties += reducedProblemResult.penalties;
    lastUpdatedEpochSecond = Math.max(
      reducedProblemResult.lastUpdatedEpochSecond,
      lastUpdatedEpochSecond
    );
  });
  return {
    penalties,
    point,
    lastUpdatedEpochSecond,
  };
};
