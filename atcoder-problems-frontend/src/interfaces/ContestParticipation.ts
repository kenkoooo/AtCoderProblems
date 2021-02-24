// Type interface for the Official API response from https://atcoder.jp/users/<user_id>/history/json.
// Response type of the API is List<ContestParticipation>

// eslint-disable-next-line import/no-default-export
export default interface ContestParticipation {
  readonly IsRated: boolean;
  readonly Place: number;
  readonly OldRating: number;
  readonly NewRating: number;
  readonly Performance: number;
  readonly InnerPerformance: number;
  readonly ContestScreenName: string;
  readonly ContestName: string;
  readonly EndTime: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
export const isContestParticipation = (obj: any): obj is ContestParticipation =>
  typeof obj === "object" &&
  obj !== null &&
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  typeof obj.IsRated === "boolean" &&
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  typeof obj.Place === "number" &&
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  typeof obj.OldRating === "number" &&
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  typeof obj.NewRating === "number" &&
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  typeof obj.Performance === "number" &&
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  typeof obj.InnerPerformance === "number" &&
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  typeof obj.ContestScreenName === "string" &&
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  typeof obj.ContestName === "string" &&
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  typeof obj.EndTime === "string";
