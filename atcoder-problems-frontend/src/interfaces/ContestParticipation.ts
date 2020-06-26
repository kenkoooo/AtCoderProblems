// Type interface for the Official API response from https://atcoder.jp/users/<user_id>/history/json.
// Response type of the API is List<ContestParticipation>

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isContestParticipation = (obj: any): obj is ContestParticipation =>
  typeof obj.IsRated === "boolean" &&
  typeof obj.Place === "number" &&
  typeof obj.OldRating === "number" &&
  typeof obj.NewRating === "number" &&
  typeof obj.Performance === "number" &&
  typeof obj.InnerPerformance === "number" &&
  typeof obj.ContestScreenName === "string" &&
  typeof obj.ContestName === "string" &&
  typeof obj.EndTime === "string";
