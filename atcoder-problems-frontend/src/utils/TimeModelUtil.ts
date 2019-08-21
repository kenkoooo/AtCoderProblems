import SolveTimeModel from "../interfaces/SolveTimeModel";

export const predictSolveTime = (timeModel: SolveTimeModel, internalRating: number): number => {
  // return predicted solve time in second.
  const logTime = timeModel.slope * internalRating + timeModel.intercept;
  return Math.exp(logTime);
};
