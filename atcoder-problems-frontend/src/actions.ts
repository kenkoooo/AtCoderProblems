import { List } from "immutable";
import Submission from "./interfaces/Submission";
import Problem from "./interfaces/Problem";
import Contest from "./interfaces/Contest";
import MergedProblem from "./interfaces/MergedProblem";
import UserInfo from "./interfaces/UserInfo";

export const UPDATE_USER_IDS = "UPDATE_USER_IDS";
export const CLEAR_SUBMISSIONS = "CLEAR_SUBMISSIONS";
export const RECEIVE_SUBMISSIONS = "RECEIVE_SUBMISSIONS";
export const RECEIVE_USER_INFO = "RECEIVE_USER_INFO";

export const REQUEST_PROBLEMS = "REQUEST_PROBLEMS";
export const RECEIVE_PROBLEMS = "RECEIVE_PROBLEMS";

export const REQUEST_CONTESTS = "REQUEST_CONTESTS";
export const RECEIVE_CONTESTS = "RECEIVE_CONTESTS";

export const REQUEST_CONTEST_PROBLEM_PAIR = "REQUEST_CONTEST_PROBLEM_PAIR";
export const RECEIVE_CONTEST_PROBLEM_PAIR = "RECEIVE_CONTEST_PROBLEM_PAIR";

export const REQUEST_MERGED_PROBLEMS = "REQUEST_MERGED_PROBLEMS";
export const RECEIVE_MERGED_PROBLEMS = "RECEIVE_MERGED_PROBLEMS";

export const REQUEST_PERF = "REQUEST_PERF";
export const RECEIVE_PERF = "RECEIVE_PERF";

export const updateUserIds = (userId: string, rivals: List<string>) => ({
  type: UPDATE_USER_IDS as typeof UPDATE_USER_IDS,
  userId,
  rivals
});

export const clearSubmissions = () => ({
  type: CLEAR_SUBMISSIONS as typeof CLEAR_SUBMISSIONS
});

export const receiveSubmissions = (submissions: List<Submission>) => ({
  type: RECEIVE_SUBMISSIONS as typeof RECEIVE_SUBMISSIONS,
  submissions
});

export const receiveUserInfo = (userInfo: UserInfo) => ({
  type: RECEIVE_USER_INFO as typeof RECEIVE_USER_INFO,
  userInfo
});

export const requestProblems = () => ({
  type: REQUEST_PROBLEMS as typeof REQUEST_PROBLEMS
});

export const receiveProblems = (problems: List<Problem>) => ({
  type: RECEIVE_PROBLEMS as typeof RECEIVE_PROBLEMS,
  problems
});

export const requestContests = () => ({
  type: REQUEST_CONTESTS as typeof REQUEST_CONTESTS
});

export const receiveContests = (contests: List<Contest>) => ({
  type: RECEIVE_CONTESTS as typeof RECEIVE_CONTESTS,
  contests
});

export const requestContestProblemPair = () => ({
  type: REQUEST_CONTEST_PROBLEM_PAIR as typeof REQUEST_CONTEST_PROBLEM_PAIR
});

export const receiveContestProblemPair = (
  contestProblemPairs: { contest_id: string; problem_id: string }[]
) => ({
  type: RECEIVE_CONTEST_PROBLEM_PAIR as typeof RECEIVE_CONTEST_PROBLEM_PAIR,
  contestProblemPairs
});

export const requestMergedProblems = () => ({
  type: REQUEST_MERGED_PROBLEMS as typeof REQUEST_MERGED_PROBLEMS
});

export const receiveMergedProblems = (mergedProblems: List<MergedProblem>) => ({
  type: RECEIVE_MERGED_PROBLEMS as typeof RECEIVE_MERGED_PROBLEMS,
  mergedProblems
});

export const requestPerf = () => ({
  type: REQUEST_PERF as typeof REQUEST_PERF
});

export const receivePerf = (
  perf: { problem_id: string; minimum_performances: number }[]
) => ({
  type: RECEIVE_PERF as typeof RECEIVE_PERF,
  perf
});

type Action =
  | ReturnType<typeof updateUserIds>
  | ReturnType<typeof clearSubmissions>
  | ReturnType<typeof receiveSubmissions>
  | ReturnType<typeof receiveUserInfo>
  | ReturnType<typeof requestProblems>
  | ReturnType<typeof receiveProblems>
  | ReturnType<typeof requestContests>
  | ReturnType<typeof receiveContests>
  | ReturnType<typeof requestContestProblemPair>
  | ReturnType<typeof receiveContestProblemPair>
  | ReturnType<typeof requestMergedProblems>
  | ReturnType<typeof receiveMergedProblems>
  | ReturnType<typeof requestPerf>
  | ReturnType<typeof receivePerf>;

export default Action;
