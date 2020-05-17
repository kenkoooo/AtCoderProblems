import Submission from "./Submission";
import { isAccepted } from "../utils";
export type ContestId = string;
export type ProblemId = string;

export enum StatusLabel {
  Success,
  Failed,
  Warning,
  None,
}

export const successStatus = (
  firstAcceptedEpochSecond: number,
  lastAcceptedEpochSecond: number,
  solvedLanguages: Set<string>
): {
  label: StatusLabel.Success;
  epoch: number;
  lastAcceptedEpochSecond: number;
  solvedLanguages: Set<string>;
} => ({
  label: StatusLabel.Success as typeof StatusLabel.Success,
  epoch: firstAcceptedEpochSecond,
  lastAcceptedEpochSecond,
  solvedLanguages,
});
export const failedStatus = (
  solvedRivals: Set<string>
): {
  label: StatusLabel.Failed;
  solvedRivals: Set<string>;
} => ({
  label: StatusLabel.Failed as typeof StatusLabel.Failed,
  solvedRivals,
});
export const warningStatus = (
  result: string,
  epoch: number
): {
  label: StatusLabel.Warning;
  result: string;
  epoch: number;
} => ({
  label: StatusLabel.Warning,
  result,
  epoch,
});
export const noneStatus = (): {
  label: StatusLabel.None;
} => ({
  label: StatusLabel.None,
});
export type ProblemStatus =
  | ReturnType<typeof successStatus>
  | ReturnType<typeof failedStatus>
  | ReturnType<typeof warningStatus>
  | ReturnType<typeof noneStatus>;

export const constructStatusLabelMap = (
  submissions: Submission[],
  userId: string
): Map<string, ProblemStatus> => {
  const submissionMap = new Map<ProblemId, Submission[]>();
  submissions.forEach((submission) => {
    const array = submissionMap.get(submission.problem_id) ?? [];
    array.push(submission);
    submissionMap.set(submission.problem_id, array);
  });

  const statusLabelMap = new Map<ProblemId, ProblemStatus>();
  Array.from(submissionMap.keys()).forEach((problemId) => {
    const list = submissionMap.get(problemId) ?? [];
    const userAccepted = list
      .filter((s) => s.user_id === userId)
      .filter((s) => isAccepted(s.result));
    const userRejected = list
      .filter((s) => s.user_id === userId)
      .filter((s) => !isAccepted(s.result));
    const rivalAccepted = list
      .filter((s) => s.user_id !== userId)
      .filter((s) => isAccepted(s.result));

    if (userAccepted.length > 0) {
      const languageSet = new Set(userAccepted.map((s) => s.language));
      const firstSolvedEpochSecond = userAccepted
        .map((s) => s.epoch_second)
        .reduceRight((a, b) => Math.min(a, b));
      const lastSolvedEpochSecond = userAccepted
        .map((s) => s.epoch_second)
        .reduceRight((a, b) => Math.max(a, b));
      statusLabelMap.set(
        problemId,
        successStatus(
          firstSolvedEpochSecond,
          lastSolvedEpochSecond,
          languageSet
        )
      );
    } else if (rivalAccepted.length > 0) {
      const rivalSet = new Set(rivalAccepted.map((s) => s.user_id));
      statusLabelMap.set(problemId, failedStatus(rivalSet));
    } else if (userRejected.length > 0) {
      userRejected.sort((a, b) => b.id - a.id);
      const last = userRejected[userRejected.length - 1];
      statusLabelMap.set(
        problemId,
        warningStatus(last.result, last.epoch_second)
      );
    } else {
      statusLabelMap.set(problemId, noneStatus());
    }
  });

  return statusLabelMap;
};
