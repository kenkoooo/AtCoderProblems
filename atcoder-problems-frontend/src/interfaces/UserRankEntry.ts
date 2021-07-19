import { hasProperty } from "../utils";

export interface UserRankEntry {
  readonly count: number;
  readonly rank: number;
}

export const isUserRankEntry = (obj: unknown): obj is UserRankEntry =>
  hasProperty(obj, "count") &&
  typeof obj.count === "number" &&
  hasProperty(obj, "rank") &&
  typeof obj.rank === "number";
