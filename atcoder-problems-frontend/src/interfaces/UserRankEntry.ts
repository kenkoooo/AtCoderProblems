import { hasPropertyAsType, isNumber } from "../utils/TypeUtils";

export interface UserRankEntry {
  readonly count: number;
  readonly rank: number;
}

export const isUserRankEntry = (obj: unknown): obj is UserRankEntry =>
  hasPropertyAsType(obj, "count", isNumber) &&
  hasPropertyAsType(obj, "rank", isNumber);
