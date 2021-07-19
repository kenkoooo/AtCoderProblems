import { hasPropertyAsType } from "../utils";

// eslint-disable-next-line import/no-default-export
export default interface Problem {
  readonly id: string;
  readonly contest_id: string;
  readonly title: string;
}

export const isProblem = (obj: unknown): obj is Problem =>
  hasPropertyAsType(obj, "id", "string") &&
  hasPropertyAsType(obj, "contest_id", "string") &&
  hasPropertyAsType(obj, "title", "string");
