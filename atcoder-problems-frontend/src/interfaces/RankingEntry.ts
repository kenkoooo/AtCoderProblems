import { hasProperty } from "../utils";

export interface RankingEntry {
  readonly problem_count: number;
  readonly user_id: string;
}

export const isRankingEntry = (obj: unknown): obj is RankingEntry =>
  hasProperty(obj, "problem_count") &&
  typeof obj.problem_count === "number" &&
  hasProperty(obj, "user_id") &&
  typeof obj.user_id === "string";

export interface RankingEntryV3 {
  readonly count: number;
  readonly user_id: string;
}

export const isRankingEntryV3 = (obj: unknown): obj is RankingEntryV3 =>
  hasProperty(obj, "count") &&
  typeof obj.count === "number" &&
  hasProperty(obj, "user_id") &&
  typeof obj.user_id === "string";

export interface SumRankingEntry {
  readonly user_id: string;
  readonly point_sum: number;
}

export const isSumRankingEntry = (obj: unknown): obj is SumRankingEntry =>
  hasProperty(obj, "user_id") &&
  typeof obj.user_id === "string" &&
  hasProperty(obj, "point_sum") &&
  typeof obj.point_sum === "number";

export interface LangRankingEntry {
  user_id: string;
  count: number;
  language: string;
}

export const isLangRankingEntry = (obj: unknown): obj is LangRankingEntry =>
  hasProperty(obj, "user_id") &&
  typeof obj.user_id === "string" &&
  hasProperty(obj, "count") &&
  typeof obj.count === "number" &&
  hasProperty(obj, "language") &&
  typeof obj.language === "string";

export interface StreakRankingEntry {
  readonly user_id: string;
  readonly streak: number;
}

export const isStreakRankingEntry = (obj: unknown): obj is StreakRankingEntry =>
  hasProperty(obj, "user_id") &&
  typeof obj.user_id === "string" &&
  hasProperty(obj, "streak") &&
  typeof obj.streak === "number";

export const isString = (obj: unknown): obj is string =>
  typeof obj === "string";
