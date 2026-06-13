import Problem from "../../../interfaces/Problem";
import ProblemModel, {
  isProblemModelWithDifficultyModel,
  isProblemModelWithTimeModel,
} from "../../../interfaces/ProblemModel";
import { ContestId, ProblemId } from "../../../interfaces/Status";
import {
  predictSolveProbability,
  predictSolveTime,
} from "../../../utils/ProblemModelUtil";
import { RecommendOption } from "./RecommendController";

const getRecommendProbability = (option: RecommendOption): number => {
  switch (option) {
    case "Easy":
      return 0.8;
    case "Moderate":
      return 0.5;
    case "Difficult":
      return 0.2;
    default:
      return 0.0;
  }
};

interface RecommendRange {
  lowerBound: number;
  upperBound: number;
}

const getRecommendProbabilityRange = (
  option: RecommendOption
): RecommendRange => {
  switch (option) {
    case "Easy":
      return {
        lowerBound: 0.5,
        upperBound: Number.POSITIVE_INFINITY,
      };
    case "Moderate":
      return {
        lowerBound: 0.2,
        upperBound: 0.8,
      };
    case "Difficult":
      return {
        lowerBound: Number.NEGATIVE_INFINITY,
        upperBound: 0.5,
      };
    default:
      return {
        lowerBound: Number.NEGATIVE_INFINITY,
        upperBound: Number.POSITIVE_INFINITY,
      };
  }
};

export const recommendProblems = (
  problems: Problem[],
  isIncluded: (problemId: ProblemId) => boolean,
  isIncludedContestCategory: (contestId: ContestId) => boolean,
  getProblemModel: (problemId: ProblemId) => ProblemModel | undefined,
  recommendExperimental: boolean,
  internalRating: number | null,
  recommendOption: RecommendOption,
  recommendNum: number
) => {
  const recommendProbability = getRecommendProbability(recommendOption);
  const recommendRange = getRecommendProbabilityRange(recommendOption);
  return problems
    .filter((p) => isIncluded(p.id))
    .filter((p) => isIncludedContestCategory(p.contest_id))
    .map((p) => ({
      ...p,
      difficulty: getProblemModel(p.id)?.difficulty,
      is_experimental: getProblemModel(p.id)?.is_experimental ?? false,
    }))
    .filter((p) => p.difficulty !== undefined)
    .filter((p) => recommendExperimental || !p.is_experimental)
    .map((p) => {
      let predictedSolveTime: number | null;
      let predictedSolveProbability: number;
      if (internalRating === null) {
        predictedSolveTime = null;
        predictedSolveProbability = -1;
      } else {
        const problemModel: ProblemModel | undefined = getProblemModel(p.id);
        if (isProblemModelWithTimeModel(problemModel)) {
          predictedSolveTime = predictSolveTime(problemModel, internalRating);
        } else {
          predictedSolveTime = null;
        }
        if (isProblemModelWithDifficultyModel(problemModel)) {
          predictedSolveProbability = predictSolveProbability(
            problemModel,
            internalRating
          );
        } else {
          predictedSolveProbability = -1;
        }
      }
      return { ...p, predictedSolveTime, predictedSolveProbability };
    })
    .filter(
      (p) =>
        recommendRange.lowerBound <= p.predictedSolveProbability &&
        p.predictedSolveProbability < recommendRange.upperBound
    )
    .sort((a, b) => {
      const da = Math.abs(a.predictedSolveProbability - recommendProbability);
      const db = Math.abs(b.predictedSolveProbability - recommendProbability);
      return da - db;
    })
    .slice(0, recommendNum)
    .sort((a, b) => (b.difficulty ?? 0) - (a.difficulty ?? 0));
};
