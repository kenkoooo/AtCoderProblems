export default interface Problem {
  readonly id: string;
  readonly contest_id: string;
  readonly title: string;
}

export const isProblem = (obj: any): obj is Problem =>
  typeof obj.id === "string" &&
  typeof obj.contest_id === "string" &&
  typeof obj.title === "string";
