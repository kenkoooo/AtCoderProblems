import {ProblemModelWithDifficultyModel, ProblemModelWithTimeModel} from "../interfaces/ProblemModel";

export const predictSolveProbability = (problemModel: ProblemModelWithDifficultyModel, internalRating: number): number => {
  return 1. / (1. + Math.exp(-problemModel.discrimination * (internalRating - problemModel.difficulty)))
};

export const predictSolveTime = (problemModel: ProblemModelWithTimeModel, internalRating: number): number => {
  // return predicted solve time in second.
  const logTime = problemModel.slope * internalRating + problemModel.intercept;
  return Math.exp(logTime);
};
