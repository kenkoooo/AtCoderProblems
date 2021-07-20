import {
  isBoolean,
  isNumber,
  hasPropertyAsType,
  hasPropertyAsTypeOrUndefined,
} from "../utils";

// eslint-disable-next-line import/no-default-export
export default interface ProblemModel {
  readonly slope: number | undefined;
  readonly intercept: number | undefined;
  readonly difficulty: number | undefined;
  readonly rawDifficulty: number | undefined;
  readonly discrimination: number | undefined;
  readonly is_experimental: boolean;
  readonly variance: number | undefined;
}

export const isProblemModel = (obj: unknown): obj is ProblemModel =>
  hasPropertyAsTypeOrUndefined(obj, "slope", isNumber) &&
  hasPropertyAsTypeOrUndefined(obj, "intercept", isNumber) &&
  hasPropertyAsTypeOrUndefined(obj, "difficulty", isNumber) &&
  hasPropertyAsTypeOrUndefined(obj, "rawDifficulty", isNumber) &&
  hasPropertyAsTypeOrUndefined(obj, "discrimination", isNumber) &&
  hasPropertyAsType(obj, "is_experimental", isBoolean) &&
  hasPropertyAsTypeOrUndefined(obj, "variance", isNumber);

export interface ProblemModelWithDifficultyModel {
  readonly slope: number | undefined;
  readonly intercept: number | undefined;
  readonly difficulty: number;
  readonly rawDifficulty: number;
  readonly discrimination: number;
  readonly is_experimental: boolean;
}

export const isProblemModelWithDifficultyModel = (
  obj: unknown
): obj is ProblemModelWithDifficultyModel =>
  obj !== undefined &&
  hasPropertyAsTypeOrUndefined(obj, "slope", isNumber) &&
  hasPropertyAsTypeOrUndefined(obj, "intercept", isNumber) &&
  hasPropertyAsType(obj, "difficulty", isNumber) &&
  hasPropertyAsType(obj, "rawDifficulty", isNumber) &&
  hasPropertyAsType(obj, "discrimination", isNumber) &&
  hasPropertyAsType(obj, "is_experimental", isBoolean);

export interface ProblemModelWithTimeModel {
  readonly slope: number;
  readonly intercept: number;
  readonly variance: number;
  readonly difficulty: number | undefined;
  readonly rawDifficulty: number | undefined;
  readonly discrimination: number | undefined;
  readonly is_experimental: boolean;
}

export const isProblemModelWithTimeModel = (
  obj: unknown
): obj is ProblemModelWithTimeModel =>
  obj !== undefined &&
  hasPropertyAsType(obj, "slope", isNumber) &&
  hasPropertyAsType(obj, "intercept", isNumber) &&
  hasPropertyAsType(obj, "variance", isNumber) &&
  hasPropertyAsTypeOrUndefined(obj, "difficult", isNumber) &&
  hasPropertyAsTypeOrUndefined(obj, "rawDifficult", isNumber) &&
  hasPropertyAsTypeOrUndefined(obj, "discrimination", isNumber) &&
  hasPropertyAsType(obj, "is_experimental", isBoolean);
