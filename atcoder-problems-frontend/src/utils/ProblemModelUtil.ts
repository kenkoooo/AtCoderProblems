import {
  ProblemModelWithDifficultyModel,
  ProblemModelWithTimeModel,
} from "../interfaces/ProblemModel";

export const predictSolveProbability = (
  problemModel: ProblemModelWithDifficultyModel,
  internalRating: number
): number => {
  return (
    1 /
    (1 +
      Math.exp(
        -problemModel.discrimination *
          (internalRating - problemModel.rawDifficulty)
      ))
  );
};

export const predictSolveTime = (
  problemModel: ProblemModelWithTimeModel,
  internalRating: number
): number => {
  // return predicted solve time in second.
  const logTime = problemModel.slope * internalRating + problemModel.intercept;
  return Math.exp(logTime);
};

export const calculateTopPlayerEquivalentEffort = (
  problemModel: ProblemModelWithTimeModel
): number => {
  const topPlayerRating = 4000;
  return predictSolveTime(problemModel, topPlayerRating);
};

export const formatPredictedSolveTime = (
  predictedSolveTime: number | null
): string => {
  if (predictedSolveTime === null) {
    return "-";
  } else if (predictedSolveTime < 30) {
    return "<1 min";
  } else {
    const minutes = Math.round(predictedSolveTime / 60);
    return `${minutes} mins`;
  }
};

export const formatPredictedSolveProbability = (
  predictedSolveProbability: number | null
): string => {
  if (predictedSolveProbability === null) {
    return "-";
  } else if (predictedSolveProbability < 0.005) {
    return "<1%";
  } else if (predictedSolveProbability > 0.995) {
    return ">99%";
  } else {
    const percents = Math.round(predictedSolveProbability * 100);
    return `${percents}%`;
  }
};
