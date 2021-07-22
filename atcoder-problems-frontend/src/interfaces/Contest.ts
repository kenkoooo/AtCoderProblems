import { hasPropertyAsType, isNumber, isString } from "../utils/TypeUtils";

// eslint-disable-next-line import/no-default-export
export default interface Contest {
  readonly start_epoch_second: number;
  readonly rate_change: string;
  readonly id: string;
  readonly duration_second: number;
  readonly title: string;
}

export const isContest = (contest: unknown): contest is Contest =>
  typeof contest === "object" &&
  contest !== null &&
  hasPropertyAsType(contest, "start_epoch_second", isNumber) &&
  hasPropertyAsType(contest, "rate_change", isString) &&
  hasPropertyAsType(contest, "id", isString) &&
  hasPropertyAsType(contest, "duration_second", isNumber) &&
  hasPropertyAsType(contest, "title", isString);
