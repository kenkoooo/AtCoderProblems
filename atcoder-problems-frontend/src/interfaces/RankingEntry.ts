import { hasPropertyAsType } from "../utils";

export interface RankingEntry {
  readonly problem_count: number;
  readonly user_id: string;
}

export const isRankingEntry = (obj: unknown): obj is RankingEntry =>
  hasPropertyAsType(obj, "problem_count", "number") &&
  hasPropertyAsType(obj, "user_id", "string");

export interface RankingEntryV3 {
  readonly count: number;
  readonly user_id: string;
}

export const isRankingEntryV3 = (obj: unknown): obj is RankingEntryV3 =>
  hasPropertyAsType(obj, "count", "number") &&
  hasPropertyAsType(obj, "user_id", "string");

export interface SumRankingEntry {
  readonly user_id: string;
  readonly point_sum: number;
}

export const isSumRankingEntry = (obj: unknown): obj is SumRankingEntry =>
  hasPropertyAsType(obj, "user_id", "string") &&
  hasPropertyAsType(obj, "point_sum", "number");

export interface LangRankingEntry {
  user_id: string;
  count: number;
  language: string;
}

export const isLangRankingEntry = (obj: unknown): obj is LangRankingEntry =>
  hasPropertyAsType(obj, "user_id", "string") &&
  hasPropertyAsType(obj, "count", "number") &&
  hasPropertyAsType(obj, "language", "string");

export interface StreakRankingEntry {
  readonly user_id: string;
  readonly streak: number;
}

export const isStreakRankingEntry = (obj: unknown): obj is StreakRankingEntry =>
  hasPropertyAsType(obj, "user_id", "string") &&
  hasPropertyAsType(obj, "streak", "number");

export const isString = (obj: unknown): obj is string =>
  typeof obj === "string";
