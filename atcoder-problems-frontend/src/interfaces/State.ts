import { List, Map } from "immutable";
import Submission from "./Submission";
import Problem from "./Problem";
import MergedProblem from "./MergedProblem";
import UserInfo from "./UserInfo";
import Contest from "./Contest";
import {
  LangRankingEntry,
  RankingEntry,
  SumRankingEntry
} from "./RankingEntry";

export type ContestId = string;
export type ProblemId = string;

export default interface State {
  readonly users: {
    readonly userId: string;
    readonly rivals: List<string>;
  };
  readonly contests: Map<ContestId, Contest>;
  readonly problems: Map<ProblemId, Problem>;
  readonly mergedProblems: Map<ProblemId, MergedProblem>;
  readonly submissions: Map<ProblemId, List<Submission>>;
  readonly contestToProblems: Map<ContestId, List<ProblemId>>;
  readonly userInfo: UserInfo | undefined;
  readonly problemPerformances: Map<ProblemId, number>;
  readonly acRanking: List<RankingEntry>;
  readonly sumRanking: List<SumRankingEntry>;
  readonly langRanking: List<LangRankingEntry>;

  readonly cache: {
    readonly statusLabelMap: Map<ProblemId, ProblemStatus>;
  };
}

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
