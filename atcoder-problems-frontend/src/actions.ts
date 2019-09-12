import { List, Map } from "immutable";
import Submission from "./interfaces/Submission";
import Problem from "./interfaces/Problem";
import Contest from "./interfaces/Contest";
import MergedProblem from "./interfaces/MergedProblem";
import UserInfo from "./interfaces/UserInfo";
import {
  LangRankingEntry,
  RankingEntry,
  SumRankingEntry
} from "./interfaces/RankingEntry";
import ProblemModel from "./interfaces/ProblemModel";
import ContestParticipation from "./interfaces/ContestParticipation";
import {TableTab} from "./pages/TablePage/TableTab";

export const RECEIVE_INITIAL_DATA = "RECEIVE_INITIAL_DATA";

export const UPDATE_USER_IDS = "UPDATE_USER_IDS";
export const RECEIVE_SUBMISSIONS = "RECEIVE_SUBMISSIONS";
export const RECEIVE_USER_INFO = "RECEIVE_USER_INFO";
export const RECEIVE_USER_CONTEST_HISTORY = "RECEIVE_USER_CONTEST_HISTORY";

export const REQUEST_MERGED_PROBLEMS = "REQUEST_MERGED_PROBLEMS";
export const RECEIVE_MERGED_PROBLEMS = "RECEIVE_MERGED_PROBLEMS";

export const REQUEST_PERF = "REQUEST_PERF";
export const RECEIVE_PERF = "RECEIVE_PERF";

export const REQUEST_AC_RANKING = "REQUEST_AC_RANKING";
export const RECEIVE_AC_RANKING = "RECEIVE_AC_RANKING";

export const REQUEST_SUM_RANKING = "REQUEST_SUM_RANKING";
export const RECEIVE_SUM_RANKING = "RECEIVE_SUM_RANKING";

export const REQUEST_LANG_RANKING = "REQUEST_LANG_RANKING";
export const RECEIVE_LANG_RANKING = "RECEIVE_LANG_RANKING";

export const UPDATE_SHOW_DIFFICULTY = "UPDATE_SHOW_DIFFICULTY";
export const UPDATE_SHOW_ACCEPTED = "UPDATE_SHOW_ACCEPTED";
export const UPDATE_ACTIVE_TABLE_TAB = "UPDATE_ACTIVE_TABLE_TAB";

export const receiveInitialData = (
  contests: List<Contest>,
  problems: List<Problem>,
  pairs: List<{ contest_id: string; problem_id: string }>,
  problemModels: Map<string, ProblemModel>
) => ({
  type: RECEIVE_INITIAL_DATA as typeof RECEIVE_INITIAL_DATA,
  contests,
  problems,
  pairs,
  problemModels
});

export const updateUserIds = (userId: string, rivals: List<string>) => ({
  type: UPDATE_USER_IDS as typeof UPDATE_USER_IDS,
  userId,
  rivals
});

export const receiveSubmissions = (submissions: List<Submission>) => ({
  type: RECEIVE_SUBMISSIONS as typeof RECEIVE_SUBMISSIONS,
  submissions
});

export const receiveUserInfo = (userInfo: UserInfo) => ({
  type: RECEIVE_USER_INFO as typeof RECEIVE_USER_INFO,
  userInfo
});

export const receiveUserContestHistory = (contestHistory: List<ContestParticipation>) => ({
  type: RECEIVE_USER_CONTEST_HISTORY as typeof RECEIVE_USER_CONTEST_HISTORY,
  contestHistory
});

export const requestMergedProblems = () => ({
  type: REQUEST_MERGED_PROBLEMS as typeof REQUEST_MERGED_PROBLEMS
});

export const receiveMergedProblems = (mergedProblems: List<MergedProblem>) => ({
  type: RECEIVE_MERGED_PROBLEMS as typeof RECEIVE_MERGED_PROBLEMS,
  mergedProblems
});

export const requestAcRanking = () => ({
  type: REQUEST_AC_RANKING as typeof REQUEST_AC_RANKING
});

export const receiveAcRanking = (ranking: List<RankingEntry>) => ({
  type: RECEIVE_AC_RANKING as typeof RECEIVE_AC_RANKING,
  ranking
});

export const requestSumRanking = () => ({
  type: REQUEST_SUM_RANKING as typeof REQUEST_SUM_RANKING
});

export const receiveSumRanking = (ranking: List<SumRankingEntry>) => ({
  type: RECEIVE_SUM_RANKING as typeof RECEIVE_SUM_RANKING,
  ranking
});

export const requestLangRanking = () => ({
  type: REQUEST_LANG_RANKING as typeof REQUEST_LANG_RANKING
});

export const receiveLangRanking = (ranking: List<LangRankingEntry>) => ({
  type: RECEIVE_LANG_RANKING as typeof RECEIVE_LANG_RANKING,
  ranking
});

export const updateShowDifficulty = (showDifficulty: boolean) => ({
  type: UPDATE_SHOW_DIFFICULTY as typeof UPDATE_SHOW_DIFFICULTY,
  showDifficulty
});

export const updateShowAccepted = (showAccepted: boolean) => ({
  type: UPDATE_SHOW_ACCEPTED as typeof UPDATE_SHOW_ACCEPTED,
  showAccepted
});

export const updateActiveTableTab = (activeTableTab: TableTab) => ({
  type: UPDATE_ACTIVE_TABLE_TAB as typeof UPDATE_ACTIVE_TABLE_TAB,
  activeTableTab
});


type Action =
  | ReturnType<typeof receiveInitialData>
  | ReturnType<typeof updateUserIds>
  | ReturnType<typeof receiveSubmissions>
  | ReturnType<typeof receiveUserInfo>
  | ReturnType<typeof receiveUserContestHistory>
  | ReturnType<typeof requestMergedProblems>
  | ReturnType<typeof receiveMergedProblems>
  | ReturnType<typeof requestAcRanking>
  | ReturnType<typeof receiveAcRanking>
  | ReturnType<typeof requestSumRanking>
  | ReturnType<typeof receiveSumRanking>
  | ReturnType<typeof requestLangRanking>
  | ReturnType<typeof receiveLangRanking>
  | ReturnType<typeof updateShowDifficulty>
  | ReturnType<typeof updateShowAccepted>
  | ReturnType<typeof updateActiveTableTab>;

export default Action;
