import { hasProperty } from "../utils";

// eslint-disable-next-line import/no-default-export
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

export const isSubmission = (obj: unknown): obj is Submission =>
  hasProperty(obj, "execution_time") &&
  (typeof obj.execution_time === "number" || obj.execution_time === null) &&
  hasProperty(obj, "point") &&
  typeof obj.point === "number" &&
  hasProperty(obj, "result") &&
  typeof obj.result === "string" &&
  hasProperty(obj, "problem_id") &&
  typeof obj.problem_id === "string" &&
  hasProperty(obj, "user_id") &&
  typeof obj.user_id === "string" &&
  hasProperty(obj, "epoch_second") &&
  typeof obj.epoch_second === "number" &&
  hasProperty(obj, "contest_id") &&
  typeof obj.contest_id === "string" &&
  hasProperty(obj, "id") &&
  typeof obj.id === "number" &&
  hasProperty(obj, "language") &&
  typeof obj.language === "string" &&
  hasProperty(obj, "length") &&
  typeof obj.length === "number";
