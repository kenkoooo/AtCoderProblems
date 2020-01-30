import { List } from "immutable";
export type ContestId = string;
export type ProblemId = string;

export enum StatusLabel {
  Success,
  Failed,
  Warning,
  None
}

export const successStatus = (epoch: number) => ({
  label: StatusLabel.Success as typeof StatusLabel.Success,
  epoch
});
export const failedStatus = (solvedRivals: List<string>) => ({
  label: StatusLabel.Failed as typeof StatusLabel.Failed,
  solvedRivals
});
export const warningStatus = (result: string, epoch: number) => ({
  label: StatusLabel.Warning as typeof StatusLabel.Warning,
  result,
  epoch
});
export const noneStatus = () => ({
  label: StatusLabel.None as typeof StatusLabel.None
});
export type ProblemStatus =
  | ReturnType<typeof successStatus>
  | ReturnType<typeof failedStatus>
  | ReturnType<typeof warningStatus>
  | ReturnType<typeof noneStatus>;
