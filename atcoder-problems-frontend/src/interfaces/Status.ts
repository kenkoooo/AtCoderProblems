import { List } from "immutable";
export type ContestId = string;
export type ProblemId = string;

export enum StatusLabel {
  Success,
  Failed,
  Warning,
  None
}

export const successStatus = () => ({
  label: StatusLabel.Success as typeof StatusLabel.Success
});
export const failedStatus = (solvedRivals: List<string>) => ({
  label: StatusLabel.Failed as typeof StatusLabel.Failed,
  solvedRivals
});
export const warningStatus = (result: string) => ({
  label: StatusLabel.Warning as typeof StatusLabel.Warning,
  result
});
export const noneStatus = () => ({
  label: StatusLabel.None as typeof StatusLabel.None
});
export type ProblemStatus =
  | ReturnType<typeof successStatus>
  | ReturnType<typeof failedStatus>
  | ReturnType<typeof warningStatus>
  | ReturnType<typeof noneStatus>;
