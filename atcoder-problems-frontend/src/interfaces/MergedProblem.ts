import {
  hasPropertyAsType,
  hasPropertyAsTypeOrNull,
  hasPropertyAsTypeOrUndefined,
  isNumber,
  isString,
} from "../utils/TypeUtils";

// eslint-disable-next-line import/no-default-export
export default interface MergedProblem {
  // Basic information
  readonly id: string;
  readonly contest_id: string;
  readonly title: string;

  // Information for first AC
  readonly first_user_id: string | null;
  readonly first_contest_id: string | null;
  readonly first_submission_id: number | null;

  // Information for fastest code
  readonly fastest_user_id: string | null;
  readonly fastest_contest_id: string | null;
  readonly fastest_submission_id: number | null;
  readonly execution_time: number | null;

  // Information for shortest code
  readonly shortest_user_id: string | null;
  readonly shortest_contest_id: string | null;
  readonly shortest_submission_id: number | null;
  readonly source_code_length: number | null;

  readonly solver_count: number | null;
  readonly point?: number | null;
}

export const isMergedProblem = (obj: unknown): obj is MergedProblem =>
  typeof obj === "object" &&
  obj !== null &&
  hasPropertyAsType(obj, "id", isString) &&
  hasPropertyAsType(obj, "contest_id", isString) &&
  hasPropertyAsType(obj, "title", isString) &&
  hasPropertyAsTypeOrNull(obj, "first_user_id", isString) &&
  hasPropertyAsTypeOrNull(obj, "first_contest_id", isString) &&
  hasPropertyAsTypeOrNull(obj, "first_submission_id", isNumber) &&
  hasPropertyAsTypeOrNull(obj, "fastest_user_id", isString) &&
  hasPropertyAsTypeOrNull(obj, "fastest_contest_id", isString) &&
  hasPropertyAsTypeOrNull(obj, "fastest_submission_id", isNumber) &&
  hasPropertyAsTypeOrNull(obj, "execution_time", isNumber) &&
  hasPropertyAsTypeOrNull(obj, "shortest_user_id", isString) &&
  hasPropertyAsTypeOrNull(obj, "shortest_contest_id", isString) &&
  hasPropertyAsTypeOrNull(obj, "shortest_submission_id", isNumber) &&
  hasPropertyAsTypeOrNull(obj, "source_code_length", isNumber) &&
  hasPropertyAsTypeOrNull(obj, "solver_count", isNumber) &&
  (hasPropertyAsTypeOrUndefined(obj, "point", isNumber) ||
    hasPropertyAsTypeOrNull(obj, "solver_count", isNumber));
