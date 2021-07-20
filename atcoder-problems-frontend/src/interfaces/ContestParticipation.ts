import {
  hasPropertyAsType,
  isBoolean,
  isNumber,
  isString,
} from "../utils/TypeUtils";

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
  hasPropertyAsType(obj, "IsRated", isBoolean) &&
  hasPropertyAsType(obj, "Place", isNumber) &&
  hasPropertyAsType(obj, "OldRating", isNumber) &&
  hasPropertyAsType(obj, "NewRating", isNumber) &&
  hasPropertyAsType(obj, "Performance", isNumber) &&
  hasPropertyAsType(obj, "InnerPerformance", isNumber) &&
  hasPropertyAsType(obj, "ContestScreenName", isString) &&
  hasPropertyAsType(obj, "ContestName", isString) &&
  hasPropertyAsType(obj, "EndTime", isString);
