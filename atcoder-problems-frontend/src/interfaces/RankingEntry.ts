/* eslint-disable @typescript-eslint/no-unsafe-member-access */
export interface RankingEntry {
  readonly problem_count: number;
  readonly user_id: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
export const isRankingEntry = (obj: any): obj is RankingEntry =>
  typeof obj.problem_count === "number" && typeof obj.user_id === "string";

export interface SumRankingEntry {
  readonly user_id: string;
  readonly point_sum: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
export const isSumRankingEntry = (obj: any): obj is SumRankingEntry =>
  typeof obj.user_id === "string" && typeof obj.point_sum === "number";

export interface LangRankingEntry {
  user_id: string;
  count: number;
  language: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
export const isLangRankingEntry = (obj: any): obj is LangRankingEntry =>
  typeof obj.user_id === "string" &&
  typeof obj.count === "number" &&
  typeof obj.language === "string";

export interface StreakRankingEntry {
  readonly user_id: string;
  readonly streak: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
export const isStreakRankingEntry = (obj: any): obj is StreakRankingEntry =>
  typeof obj.user_id === "string" && typeof obj.streak === "number";
