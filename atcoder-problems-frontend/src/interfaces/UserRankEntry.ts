/* eslint-disable @typescript-eslint/no-unsafe-member-access */
export interface UserRankEntry {
  readonly count: number;
  readonly rank: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
export const isUserRankEntry = (obj: any): obj is UserRankEntry =>
  typeof obj.count === "number" && typeof obj.rank === "number";
