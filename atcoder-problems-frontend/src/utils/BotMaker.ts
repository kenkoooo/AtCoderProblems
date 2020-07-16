import random from "random";
import seedrandom from "seedrandom";
import {
  ProblemModelWithDifficultyModel,
  ProblemModelWithTimeModel,
} from "../interfaces/ProblemModel";
import { ProblemId } from "../interfaces/Status";
import {
  calcUserTotalResult,
  compareTotalResult,
  ReducedProblemResult,
  UserTotalResult,
} from "../pages/Internal/VirtualContest/ShowContest/ResultCalcUtil";
import { binarySearch } from "./BinarySearch";
import { predictSolveProbability } from "./ProblemModelUtil";
import { calculatePerformances } from "./RatingSystem";

export const makeFittingBots = (
  makeBots: (bootstrapRatings: number[]) => BotRunner[],
  userResults: UserTotalResult[]
) => {
  const initialBootstrap = [] as number[];
  for (let i = -1000; i < 4200; i += 500) {
    initialBootstrap.push(i);
  }
  const bots = makeBots(initialBootstrap);
  while (bots.length < 400) {
    const botResults = bots.map((bot) => {
      const result = calcUserTotalResult(bot.result);
      return { result, rating: bot.rating };
    });
    botResults.sort((a, b) => compareTotalResult(a.result, b.result));
    const botPerfs = calculatePerformances(botResults.map((b) => b.rating));
    const userPerfs = userResults.map((result) => {
      const index = binarySearch(botResults, result, (bot, user) =>
        compareTotalResult(bot.result, user)
      );
      if (index === 0) {
        return botPerfs[index];
      } else if (index === botPerfs.length) {
        return botPerfs[index - 1];
      } else {
        return (botPerfs[index - 1] + botPerfs[index]) / 2;
      }
    });
    bots.push(...makeBots(userPerfs));
  }
  return bots;
};

interface BotRunner {
  result: Map<ProblemId, ReducedProblemResult>;
  rating: number;
}

export const makeBotRunners = (
  problemModelAndPoints: {
    problemModel: ProblemModelWithDifficultyModel & ProblemModelWithTimeModel;
    problemId: string;
    point: number;
  }[],
  start: number,
  end: number,
  bootstrapRatings: number[]
) => {
  random.use(seedrandom("atcoder-problems"));
  problemModelAndPoints.sort(
    (a, b) => a.problemModel.difficulty - b.problemModel.difficulty
  );

  const runners = [] as BotRunner[];
  bootstrapRatings.forEach((bootstrapRating) => {
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
  });

  return runners;
};
