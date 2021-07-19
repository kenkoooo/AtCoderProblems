import { hasPropertyAsType } from "../utils";

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
  hasPropertyAsType(obj, "IsRated", "boolean") &&
  hasPropertyAsType(obj, "Place", "number") &&
  hasPropertyAsType(obj, "OldRating", "number") &&
  hasPropertyAsType(obj, "NewRating", "number") &&
  hasPropertyAsType(obj, "Performance", "number") &&
  hasPropertyAsType(obj, "InnerPerformance", "number") &&
  hasPropertyAsType(obj, "ContestScreenName", "string") &&
  hasPropertyAsType(obj, "ContestName", "string") &&
  hasPropertyAsType(obj, "EndTime", "string");
