import { hasProperty } from "../utils";

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
  hasProperty(contest, "start_epoch_second") &&
  typeof contest.start_epoch_second === "number" &&
  hasProperty(contest, "rate_change") &&
  typeof contest.rate_change === "string" &&
  hasProperty(contest, "id") &&
  typeof contest.id === "string" &&
  hasProperty(contest, "duration_second") &&
  typeof contest.duration_second === "number" &&
  hasProperty(contest, "title") &&
  typeof contest.title === "string";
