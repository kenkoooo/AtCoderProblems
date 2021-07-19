import { hasPropertyAsType, hasPropertyAsTypeOrUndefined } from "../utils";

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
  hasPropertyAsTypeOrUndefined(obj, "slope", "number") &&
  hasPropertyAsTypeOrUndefined(obj, "intercept", "number") &&
  hasPropertyAsTypeOrUndefined(obj, "difficulty", "number") &&
  hasPropertyAsTypeOrUndefined(obj, "rawDifficulty", "number") &&
  hasPropertyAsTypeOrUndefined(obj, "discrimination", "number") &&
  hasPropertyAsType(obj, "is_experimental", "boolean") &&
  hasPropertyAsTypeOrUndefined(obj, "variance", "number");

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
  hasPropertyAsTypeOrUndefined(obj, "slope", "number") &&
  hasPropertyAsTypeOrUndefined(obj, "intercept", "number") &&
  hasPropertyAsType(obj, "difficulty", "number") &&
  hasPropertyAsType(obj, "rawDifficulty", "number") &&
  hasPropertyAsType(obj, "discrimination", "number") &&
  hasPropertyAsType(obj, "is_experimental", "boolean");

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
  hasPropertyAsType(obj, "slope", "number") &&
  hasPropertyAsType(obj, "intercept", "number") &&
  hasPropertyAsType(obj, "variance", "number") &&
  hasPropertyAsTypeOrUndefined(obj, "difficult", "number") &&
  hasPropertyAsTypeOrUndefined(obj, "rawDifficult", "number") &&
  hasPropertyAsTypeOrUndefined(obj, "discrimination", "number") &&
  hasPropertyAsType(obj, "is_experimental", "boolean");
