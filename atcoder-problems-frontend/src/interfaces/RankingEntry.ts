import { hasPropertyAsType, isNumber, isString } from "../utils/TypeUtils";

export interface RankingEntry {
  readonly problem_count: number;
  readonly user_id: string;
}

export const isRankingEntry = (obj: unknown): obj is RankingEntry =>
  hasPropertyAsType(obj, "problem_count", isNumber) &&
  hasPropertyAsType(obj, "user_id", isString);

export interface RankingEntryV3 {
  readonly count: number;
  readonly user_id: string;
}

export const isRankingEntryV3 = (obj: unknown): obj is RankingEntryV3 =>
  hasPropertyAsType(obj, "count", isNumber) &&
  hasPropertyAsType(obj, "user_id", isString);

export interface SumRankingEntry {
  readonly user_id: string;
  readonly point_sum: number;
}

export const isSumRankingEntry = (obj: unknown): obj is SumRankingEntry =>
  hasPropertyAsType(obj, "user_id", isString) &&
  hasPropertyAsType(obj, "point_sum", isNumber);

export interface LangRankingEntry {
  user_id: string;
  count: number;
  language: string;
}

export const isLangRankingEntry = (obj: unknown): obj is LangRankingEntry =>
  hasPropertyAsType(obj, "user_id", isString) &&
  hasPropertyAsType(obj, "count", isNumber) &&
  hasPropertyAsType(obj, "language", isString);
