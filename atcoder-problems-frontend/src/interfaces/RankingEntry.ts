import { hasPropertyAsType, isNumber, isString } from "../utils/TypeUtils";

export interface RankingEntry {
  readonly count: number;
  readonly user_id: string;
}

export const isRankingEntry = (obj: unknown): obj is RankingEntry =>
  hasPropertyAsType(obj, "count", isNumber) &&
  hasPropertyAsType(obj, "user_id", isString);

export interface LangRankingEntry {
  user_id: string;
  count: number;
  language: string;
}

export const isLangRankingEntry = (obj: unknown): obj is LangRankingEntry =>
  hasPropertyAsType(obj, "user_id", isString) &&
  hasPropertyAsType(obj, "count", isNumber) &&
  hasPropertyAsType(obj, "language", isString);
