export default interface ProblemModel {
  readonly slope: number | undefined;
  readonly intercept: number | undefined;
  readonly difficulty: number | undefined;
  readonly discrimination: number | undefined;
}

export const isProblemModel = (obj: any): obj is ProblemModel =>
  (typeof obj.slope === "number" || typeof obj.slope === "undefined") &&
  (typeof obj.intercept === "number" || typeof obj.intercept === "undefined") &&
  (typeof obj.difficulty === "number" || typeof obj.difficulty === "undefined") &&
  (typeof obj.discrimination === "number" || typeof obj.discrimination === "undefined");


export interface ProblemModelWithDifficultyModel {
  readonly slope: number | undefined;
  readonly intercept: number | undefined;
  readonly difficulty: number;
  readonly discrimination: number;
}

export const isProblemModelWithDifficultyModel = (obj: any): obj is ProblemModelWithDifficultyModel =>
  (typeof obj.slope === "number" || typeof obj.slope === "undefined") &&
  (typeof obj.intercept === "number" || typeof obj.intercept === "undefined") &&
  typeof obj.difficulty === "number" &&
  typeof obj.discrimination === "number";


export interface ProblemModelWithTimeModel {
  readonly slope: number;
  readonly intercept: number;
  readonly difficulty: number | undefined;
  readonly discrimination: number | undefined;
}

export const isProblemModelWithTimeModel = (obj: any): obj is ProblemModelWithTimeModel =>
  typeof obj.slope === "number" &&
  typeof obj.intercept === "number" &&
  (typeof obj.difficulty === "number" || typeof obj.difficulty === "undefined") &&
  (typeof obj.discrimination === "number" || typeof obj.discrimination === "undefined");
