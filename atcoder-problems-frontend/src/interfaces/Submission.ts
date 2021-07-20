import {
  hasPropertyAsType,
  hasPropertyAsTypeOrNull,
  isNumber,
  isString,
} from "../utils/TypeUtils";

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
  hasPropertyAsTypeOrNull(obj, "execution_time", isNumber) &&
  hasPropertyAsType(obj, "point", isNumber) &&
  hasPropertyAsType(obj, "result", isString) &&
  hasPropertyAsType(obj, "problem_id", isString) &&
  hasPropertyAsType(obj, "user_id", isString) &&
  hasPropertyAsType(obj, "epoch_second", isNumber) &&
  hasPropertyAsType(obj, "contest_id", isString) &&
  hasPropertyAsType(obj, "id", isNumber) &&
  hasPropertyAsType(obj, "language", isString) &&
  hasPropertyAsType(obj, "length", isNumber);
