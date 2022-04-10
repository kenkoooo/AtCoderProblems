import { hasPropertyAsType, isString } from "../utils/TypeUtils";

// eslint-disable-next-line import/no-default-export
export default interface Problem {
  readonly id: string;
  readonly contest_id: string;
  readonly problem_index: string;
  readonly name: string;
}

export const isProblem = (obj: unknown): obj is Problem =>
  hasPropertyAsType(obj, "id", isString) &&
  hasPropertyAsType(obj, "contest_id", isString) &&
  hasPropertyAsType(obj, "problem_index", isString) &&
  hasPropertyAsType(obj, "name", isString);
