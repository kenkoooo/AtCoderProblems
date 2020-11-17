// eslint-disable-next-line import/no-default-export
export default interface Contest {
  readonly start_epoch_second: number;
  readonly rate_change: string;
  readonly id: string;
  readonly duration_second: number;
  readonly title: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
export const isContest = (contest: any): contest is Contest =>
  typeof contest === "object" &&
  contest !== null &&
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  typeof contest.start_epoch_second === "number" &&
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  typeof contest.rate_change === "string" &&
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  typeof contest.id === "string" &&
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  typeof contest.duration_second === "number" &&
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  typeof contest.title === "string";
