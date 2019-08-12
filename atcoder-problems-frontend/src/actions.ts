import { List } from "immutable";
import Submission from "./interfaces/Submission";
import Problem from "./interfaces/Problem";
import Contest from "./interfaces/Contest";
import MergedProblem from "./interfaces/MergedProblem";
import UserInfo from "./interfaces/UserInfo";

export const RECEIVE_INITIAL_DATA = "RECEIVE_INITIAL_DATA";

export const UPDATE_USER_IDS = "UPDATE_USER_IDS";
export const CLEAR_SUBMISSIONS = "CLEAR_SUBMISSIONS";
export const RECEIVE_SUBMISSIONS = "RECEIVE_SUBMISSIONS";
export const RECEIVE_USER_INFO = "RECEIVE_USER_INFO";

export const REQUEST_MERGED_PROBLEMS = "REQUEST_MERGED_PROBLEMS";
export const RECEIVE_MERGED_PROBLEMS = "RECEIVE_MERGED_PROBLEMS";

export const REQUEST_PERF = "REQUEST_PERF";
export const RECEIVE_PERF = "RECEIVE_PERF";

export const receiveInitialData = (
  contests: List<Contest>,
  problems: List<Problem>,
  pairs: List<{ contest_id: string; problem_id: string }>
) => ({
  type: RECEIVE_INITIAL_DATA as typeof RECEIVE_INITIAL_DATA,
  contests,
  problems,
  pairs
});

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
  perf: { problem_id: string; minimum_performance: number }[]
) => ({
  type: RECEIVE_PERF as typeof RECEIVE_PERF,
  perf
});

type Action =
  | ReturnType<typeof receiveInitialData>
  | ReturnType<typeof updateUserIds>
  | ReturnType<typeof clearSubmissions>
  | ReturnType<typeof receiveSubmissions>
  | ReturnType<typeof receiveUserInfo>
  | ReturnType<typeof requestMergedProblems>
  | ReturnType<typeof receiveMergedProblems>
  | ReturnType<typeof requestPerf>
  | ReturnType<typeof receivePerf>;

export default Action;
