export default interface ProblemModel {
  readonly slope: number | undefined;
  readonly intercept: number | undefined;
  readonly difficulty: number | undefined;
  readonly rawDifficulty: number | undefined;
  readonly discrimination: number | undefined;
  readonly is_experimental: boolean;
  readonly variance: number | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isProblemModel = (obj: any): obj is ProblemModel =>
  (typeof obj.slope === "number" || typeof obj.slope === "undefined") &&
  (typeof obj.intercept === "number" || typeof obj.intercept === "undefined") &&
  (typeof obj.difficulty === "number" ||
    typeof obj.difficulty === "undefined") &&
  (typeof obj.rawDifficulty === "number" ||
    typeof obj.rawDifficulty === "undefined") &&
  (typeof obj.discrimination === "number" ||
    typeof obj.discrimination === "undefined") &&
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any
): obj is ProblemModelWithDifficultyModel =>
  obj !== undefined &&
  (typeof obj.slope === "number" || typeof obj.slope === "undefined") &&
  (typeof obj.intercept === "number" || typeof obj.intercept === "undefined") &&
  typeof obj.difficulty === "number" &&
  typeof obj.rawDifficulty === "number" &&
  typeof obj.discrimination === "number" &&
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any
): obj is ProblemModelWithTimeModel =>
  typeof obj.slope === "number" &&
  typeof obj.intercept === "number" &&
  typeof obj.variance === "number" &&
  (typeof obj.difficulty === "number" ||
    typeof obj.difficulty === "undefined") &&
  (typeof obj.rawDifficulty === "number" ||
    typeof obj.rawDifficulty === "undefined") &&
  (typeof obj.discrimination === "number" ||
    typeof obj.discrimination === "undefined") &&
  typeof obj.is_experimental === "boolean";
