import { hasPropertyAsType } from "../utils";

export interface UserRankEntry {
  readonly count: number;
  readonly rank: number;
}

export const isUserRankEntry = (obj: unknown): obj is UserRankEntry =>
  hasPropertyAsType(obj, "count", "number") &&
  hasPropertyAsType(obj, "rank", "number");
