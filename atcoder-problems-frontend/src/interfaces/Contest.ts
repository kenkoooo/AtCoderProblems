// eslint-disable-next-line import/no-default-export
export default interface Contest {
  readonly start_epoch_second: number;
  readonly rate_change: string;
  readonly id: string;
  readonly duration_second: number;
  readonly title: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isContest = (contest: any): contest is Contest =>
  typeof contest.start_epoch_second === "number" &&
  typeof contest.rate_change === "string" &&
  typeof contest.id === "string" &&
  typeof contest.duration_second === "number" &&
  typeof contest.title === "string";
