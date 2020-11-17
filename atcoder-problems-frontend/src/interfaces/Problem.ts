/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// eslint-disable-next-line import/no-default-export
export default interface Problem {
  readonly id: string;
  readonly contest_id: string;
  readonly title: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
export const isProblem = (obj: any): obj is Problem =>
  typeof obj.id === "string" &&
  typeof obj.contest_id === "string" &&
  typeof obj.title === "string";
