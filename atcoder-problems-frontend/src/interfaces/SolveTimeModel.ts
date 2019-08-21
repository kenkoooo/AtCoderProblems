export default interface SolveTimeModel {
  readonly slope: number;
  readonly intercept: number;
}

export const isSolveTimeModel = (obj: any): obj is SolveTimeModel =>
  typeof obj.slope === "number" &&
  typeof obj.intercept === "number";
