import { hasPropertyAsType, hasPropertyAsTypeOrNull } from "../utils";

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
  hasPropertyAsTypeOrNull(obj, "execution_time", "number") &&
  hasPropertyAsType(obj, "point", "number") &&
  hasPropertyAsType(obj, "result", "string") &&
  hasPropertyAsType(obj, "problem_id", "string") &&
  hasPropertyAsType(obj, "user_id", "string") &&
  hasPropertyAsType(obj, "epoch_second", "number") &&
  hasPropertyAsType(obj, "contest_id", "string") &&
  hasPropertyAsType(obj, "id", "number") &&
  hasPropertyAsType(obj, "language", "string") &&
  hasPropertyAsType(obj, "length", "number");
