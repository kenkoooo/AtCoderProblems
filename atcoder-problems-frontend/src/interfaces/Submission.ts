export default interface Submission {
  readonly execution_time: number | null;
  readonly point: number;
  readonly result: string;
  readonly problem_id: string;
  readonly user_id: string;
  readonly epoch_second: number;
  readonly contest_id: string;
  readonly id: number;
  readonly language: string;
  readonly length: number;
}

export const isSumbission = (obj: any): obj is Submission =>
  (typeof obj.execution_time === "number" || obj.execution_time === null) &&
  typeof obj.point === "number" &&
  typeof obj.result === "string" &&
  typeof obj.problem_id === "string" &&
  typeof obj.user_id === "string" &&
  typeof obj.epoch_second === "number" &&
  typeof obj.contest_id === "string" &&
  typeof obj.id === "number" &&
  typeof obj.language === "string" &&
  typeof obj.length === "number";
