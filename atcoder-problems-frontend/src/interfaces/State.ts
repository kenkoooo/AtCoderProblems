import { List } from "immutable";
import Submission from "./Submission";
import Problem from "./Problem";
import MergedProblem from "./MergedProblem";
import UserInfo from "./UserInfo";
import Contest from "./Contest";

export default interface State {
  readonly userId: string;
  readonly rivals: List<string>;
  readonly contests: List<Contest>;
  readonly problems: List<Problem>;
  readonly mergedProblems: List<MergedProblem>;
  readonly submissions: List<Submission>;
  readonly userInfo: UserInfo | undefined;
}
