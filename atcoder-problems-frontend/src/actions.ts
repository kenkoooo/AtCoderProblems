import { List } from "immutable";
import Submission from "./interfaces/Submission";
import Problem from "./interfaces/Problem";
import Contest from "./interfaces/Contest";

export const UPDATE_USER_IDS = "UPDATE_USER_IDS";
export const CLEAR_SUBMISSIONS = "CLEAR_SUBMISSIONS";
export const RECEIVE_SUBMISSIONS = "RECEIVE_SUBMISSIONS";

export const REQUEST_PROBLEMS = "REQUEST_PROBLEMS";
export const RECEIVE_PROBLEMS = "RECEIVE_PROBLEMS";

export const REQUEST_CONTESTS = "REQUEST_CONTESTS";
export const RECEIVE_CONTESTS = "RECEIVE_CONTESTS";

export const REQUEST_CONTEST_PROBLEM_PAIR = "REQUEST_CONTEST_PROBLEM_PAIR";
export const RECEIVE_CONTEST_PROBLEM_PAIR = "RECEIVE_CONTEST_PROBLEM_PAIR";

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

type Action =
  | ReturnType<typeof updateUserIds>
  | ReturnType<typeof clearSubmissions>
  | ReturnType<typeof receiveSubmissions>
  | ReturnType<typeof requestProblems>
  | ReturnType<typeof receiveProblems>
  | ReturnType<typeof requestContests>
  | ReturnType<typeof receiveContests>
  | ReturnType<typeof requestContestProblemPair>
  | ReturnType<typeof receiveContestProblemPair>;

export default Action;
