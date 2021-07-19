import { hasProperty } from "../utils";

// eslint-disable-next-line import/no-default-export
export default interface Problem {
  readonly id: string;
  readonly contest_id: string;
  readonly title: string;
}

export const isProblem = (obj: unknown): obj is Problem =>
  hasProperty(obj, "id") &&
  typeof obj.id === "string" &&
  hasProperty(obj, "contest_id") &&
  typeof obj.contest_id === "string" &&
  hasProperty(obj, "title") &&
  typeof obj.title === "string";
