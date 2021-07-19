import { hasProperty } from "../utils";

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

export const isContestParticipation = (
  obj: unknown
): obj is ContestParticipation =>
  typeof obj === "object" &&
  obj !== null &&
  hasProperty(obj, "IsRated") &&
  typeof obj.IsRated === "boolean" &&
  hasProperty(obj, "Place") &&
  typeof obj.Place === "number" &&
  hasProperty(obj, "OldRating") &&
  typeof obj.OldRating === "number" &&
  hasProperty(obj, "NewRating") &&
  typeof obj.NewRating === "number" &&
  hasProperty(obj, "Performance") &&
  typeof obj.Performance === "number" &&
  hasProperty(obj, "InnerPerformance") &&
  typeof obj.InnerPerformance === "number" &&
  hasProperty(obj, "ContestScreenName") &&
  typeof obj.ContestScreenName === "string" &&
  hasProperty(obj, "ContestName") &&
  typeof obj.ContestName === "string" &&
  hasProperty(obj, "EndTime") &&
  typeof obj.EndTime === "string";
