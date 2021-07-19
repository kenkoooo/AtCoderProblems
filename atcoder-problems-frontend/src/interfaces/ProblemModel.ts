import { hasProperty } from "../utils";

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
  (!hasProperty(obj, "slope") ||
    typeof obj.slope === "number" ||
    typeof obj.slope === "undefined") &&
  (!hasProperty(obj, "intercept") ||
    typeof obj.intercept === "number" ||
    typeof obj.intercept === "undefined") &&
  (!hasProperty(obj, "difficulty") ||
    typeof obj.difficulty === "number" ||
    typeof obj.difficulty === "undefined") &&
  (!hasProperty(obj, "rawDifficulty") ||
    typeof obj.rawDifficulty === "number" ||
    typeof obj.rawDifficulty === "undefined") &&
  (!hasProperty(obj, "discrimination") ||
    typeof obj.discrimination === "number" ||
    typeof obj.discrimination === "undefined") &&
  hasProperty(obj, "is_experimental") &&
  typeof obj.is_experimental === "boolean";

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
  (!hasProperty(obj, "slope") ||
    typeof obj.slope === "number" ||
    typeof obj.slope === "undefined") &&
  (!hasProperty(obj, "intercept") ||
    typeof obj.intercept === "number" ||
    typeof obj.intercept === "undefined") &&
  hasProperty(obj, "difficulty") &&
  typeof obj.difficulty === "number" &&
  hasProperty(obj, "rawDifficulty") &&
  typeof obj.rawDifficulty === "number" &&
  hasProperty(obj, "discrimination") &&
  typeof obj.discrimination === "number" &&
  hasProperty(obj, "is_experimental") &&
  typeof obj.is_experimental === "boolean";

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
  hasProperty(obj, "slope") &&
  typeof obj.slope === "number" &&
  hasProperty(obj, "intercept") &&
  typeof obj.intercept === "number" &&
  hasProperty(obj, "variance") &&
  typeof obj.variance === "number" &&
  (!hasProperty(obj, "difficulty") ||
    typeof obj.difficulty === "number" ||
    typeof obj.difficulty === "undefined") &&
  (!hasProperty(obj, "rawDifficulty") ||
    typeof obj.rawDifficulty === "number" ||
    typeof obj.rawDifficulty === "undefined") &&
  (!hasProperty(obj, "discrimination") ||
    typeof obj.discrimination === "number" ||
    typeof obj.discrimination === "undefined") &&
  hasProperty(obj, "is_experimental") &&
  typeof obj.is_experimental === "boolean";
