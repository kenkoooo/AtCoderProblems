import { List, Set } from "immutable";
export type ContestId = string;
export type ProblemId = string;

export enum StatusLabel {
  Success,
  Failed,
  Warning,
  None
}

export const successStatus = (epoch: number, solvedLanguages: Set<string>) => ({
  label: StatusLabel.Success as typeof StatusLabel.Success,
  epoch,
  solvedLanguages
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

export const deserializeProblemStatus = (
  problemStatus: any
): ProblemStatus | undefined => {
  switch (problemStatus.label) {
    case StatusLabel.Success: {
      if (
        typeof problemStatus.epoch !== "number" ||
        !Array.isArray(problemStatus.solvedLanguages)
      ) {
        return undefined;
      }
      const solvedLanguages: string[] = problemStatus.solvedLanguages.filter(
        (e: any): e is string => typeof e === "string"
      );

      return successStatus(problemStatus.epoch, Set(solvedLanguages));
    }
    case StatusLabel.Failed: {
      if (!Array.isArray(problemStatus.solvedRivals)) {
        return undefined;
      }
      const solvedRivals: string[] = problemStatus.solvedRivals.filter(
        (e: any): e is string => typeof e === "string"
      );
      return failedStatus(List(solvedRivals));
    }
    case StatusLabel.Warning: {
      if (
        typeof problemStatus.epoch !== "number" ||
        typeof problemStatus.result !== "string"
      ) {
        return undefined;
      }
      return warningStatus(problemStatus.result, problemStatus.epoch);
    }
    case StatusLabel.None: {
      return noneStatus();
    }
    default:
      return undefined;
  }
};
