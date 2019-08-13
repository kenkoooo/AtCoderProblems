import { List, Map } from "immutable";
import Submission from "./Submission";
import Problem from "./Problem";
import MergedProblem from "./MergedProblem";
import UserInfo from "./UserInfo";
import Contest from "./Contest";
import { RankingEntry, SumRankingEntry } from "./RankingEntry";

type ContestId = string;
type ProblemId = string;

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
}
