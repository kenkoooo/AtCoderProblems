import random from "random";
import seedrandom from "seedrandom";
import {
  ProblemModelWithDifficultyModel,
  ProblemModelWithTimeModel,
} from "../interfaces/ProblemModel";
import { ProblemId } from "../interfaces/Status";
import { ReducedProblemResult } from "../pages/Internal/VirtualContest/ShowContest/ResultCalcUtil";
import { predictSolveProbability } from "./ProblemModelUtil";

type ModelType = ProblemModelWithDifficultyModel & ProblemModelWithTimeModel;

export function calculatePerformances(
  participantRawRatings: number[]
): number[] {
  const perfs: number[] = [];
  const predictedRankCache = new Map();
  const participants = participantRawRatings.length;
  for (let position = 0; position < participants; position++) {
    let ub = 10000;
    let lb = -10000;
    while (Math.round(lb) < Math.round(ub)) {
      const m = (lb + ub) / 2;
      if (!predictedRankCache.has(m)) {
        let predictedRank = 0;
        for (const participantRawRating of participantRawRatings) {
          predictedRank += 1 / (1 + 6.0 ** ((m - participantRawRating) / 400));
        }
        predictedRankCache.set(m, predictedRank);
      }
      const predictedRank = predictedRankCache.get(m);
      if (predictedRank < position + 0.5) {
        ub = m;
      } else {
        lb = m;
      }
    }
    perfs.push(Math.round(lb));
  }
  return perfs;
}

export interface BotRunner {
  result: Map<ProblemId, ReducedProblemResult>;
  rating: number;
}

export const makeBotRunners = (
  problemModelAndPoints: {
    problemModel: ModelType;
    problemId: string;
    point: number;
  }[],
  start: number,
  end: number
) => {
  random.use(seedrandom("atcoder-problems"));
  problemModelAndPoints.sort(
    (a, b) => a.problemModel.difficulty - b.problemModel.difficulty
  );

  const runners = [] as BotRunner[];
  for (
    let bootstrapRating = -1025;
    bootstrapRating <= 4025;
    bootstrapRating += 5
  ) {
    const result = new Map<ProblemId, ReducedProblemResult>();

    // generating bootstrap result assuming that participants solve problems in the listed order.
    // potentially better to reorder it to maximize these performances.
    let currentTime = start;
    problemModelAndPoints.forEach(({ problemModel, point, problemId }) => {
      const tooEasy = problemModel.rawDifficulty > -10000;
      const logTimeMean =
        problemModel.slope * bootstrapRating + problemModel.intercept;
      const solveProbability = tooEasy
        ? predictSolveProbability(problemModel, bootstrapRating)
        : 1;
      while (random.float() >= solveProbability && currentTime <= end) {
        currentTime += logTimeMean;
      }

      const solveTime = random.logNormal(
        logTimeMean,
        Math.sqrt(problemModel.variance)
      )();
      if (solveTime + currentTime > end) {
        currentTime = end;
        return;
      }

      currentTime += solveTime;
      result.set(problemId, {
        trials: 1,
        penalties: 0,
        accepted: true,
        point,
        lastUpdatedEpochSecond: Math.round(currentTime),
      });
    });

    runners.push({
      result: result,
      rating: bootstrapRating,
    });
  }

  return runners;
};
