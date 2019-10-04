export interface RankingEntry {
  readonly problem_count: number;
  readonly user_id: string;
}

export const isRankingEntry = (obj: any): obj is RankingEntry =>
  typeof obj.problem_count === "number" && typeof obj.user_id === "string";

export interface SumRankingEntry {
  readonly user_id: string;
  readonly point_sum: number;
}

export const isSumRankingEntry = (obj: any): obj is SumRankingEntry =>
  typeof obj.user_id === "string" && typeof obj.point_sum === "number";

export interface LangRankingEntry {
  user_id: string;
  count: number;
  language: string;
}

export const isLangRankingEntry = (obj: any): obj is LangRankingEntry =>
  typeof obj.user_id === "string" &&
  typeof obj.count === "number" &&
  typeof obj.language === "string";

export interface StreakRankingEntry {
  readonly user_id: string;
  readonly streak: number;
}

export const isStreakRankingEntry = (obj: any): obj is StreakRankingEntry =>
  typeof obj.user_id === "string" && typeof obj.streak === "number";
