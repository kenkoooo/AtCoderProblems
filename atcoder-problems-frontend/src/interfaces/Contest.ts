import { hasPropertyAsType } from "../utils";

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
  hasPropertyAsType(contest, "start_epoch_second", "number") &&
  hasPropertyAsType(contest, "rate_change", "string") &&
  hasPropertyAsType(contest, "id", "string") &&
  hasPropertyAsType(contest, "duration_second", "number") &&
  hasPropertyAsType(contest, "title", "string");
