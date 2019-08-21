import { isContest } from "../interfaces/Contest";
import { isProblem } from "../interfaces/Problem";
import MergedProblem, { isMergedProblem } from "../interfaces/MergedProblem";
import { isSubmission } from "../interfaces/Submission";
import { List, Map } from "immutable";
import {
  isLangRankingEntry,
  isRankingEntry,
  isSumRankingEntry,
  RankingEntry
} from "../interfaces/RankingEntry";
import { isUserInfo } from "../interfaces/UserInfo";
import {isContestParticipation} from "../interfaces/ContestParticipation";
import {isSolveTimeModel} from "../interfaces/SolveTimeModel";

const BASE_URL = "https://kenkoooo.com/atcoder";
const STATIC_API_BASE_URL = BASE_URL + "/resources";
const DYNAMIC_API_BASE_URL = BASE_URL + "/atcoder-api";

const OFFICIAL_PROXY_BASE_URL = BASE_URL + "/proxy";

const AC_COUNT_URL = STATIC_API_BASE_URL + "/ac.json";
const SUM_URL = STATIC_API_BASE_URL + "/sums.json";
const LANG_URL = STATIC_API_BASE_URL + "/lang.json";

const generateRanking = (
  problems: List<MergedProblem>,
  property: "fastest_user_id" | "shortest_user_id" | "first_user_id"
) =>
  problems
    .map(problem => problem[property])
    .reduce(
      (map, userId) => (userId ? map.update(userId, 0, c => c + 1) : map),
      Map<string, number>()
    )
    .entrySeq()
    .map(
      ([user_id, problem_count]): RankingEntry => ({ user_id, problem_count })
    )
    .toList();

export const getShortRanking = (problems: List<MergedProblem>) =>
  generateRanking(problems, "shortest_user_id");
export const getFastRanking = (problems: List<MergedProblem>) =>
  generateRanking(problems, "fastest_user_id");
export const getFirstRanking = (problems: List<MergedProblem>) =>
  generateRanking(problems, "first_user_id");

export function fetchTypedList<T>(
  url: string,
  typeGuardFn: (obj: any) => obj is T
) {
  return fetch(url)
    .then(r => r.json())
    .then((array: any[]) => array.filter(typeGuardFn))
    .then(array => List(array));
}

export function fetchTypedMap<V>(
  url: string,
  typeGuardFn: (obj: any) => obj is V
) {
  return fetch(url)
    .then(r => r.json())
    .then((obj: {[p: string]: any}) => Map(obj))
    .then(m => m.filter(typeGuardFn));
}

export const fetchACRanking = () =>
  fetchTypedList(AC_COUNT_URL, isRankingEntry);

export const fetchSumRanking = () => fetchTypedList(SUM_URL, isSumRankingEntry);

export const fetchLangRanking = () =>
  fetchTypedList(LANG_URL, isLangRankingEntry);

export const fetchContestProblemPairs = () =>
  fetchTypedList(
    STATIC_API_BASE_URL + "/contest-problem.json",
    (obj: any): obj is { contest_id: string; problem_id: string } =>
      typeof obj.contest_id === "string" && typeof obj.problem_id === "string"
  );

export const fetchContests = () =>
  fetchTypedList(STATIC_API_BASE_URL + "/contests.json", isContest);

export const fetchProblems = () =>
  fetchTypedList(STATIC_API_BASE_URL + "/problems.json", isProblem);

export const fetchMergedProblems = () =>
  fetchTypedList(
    STATIC_API_BASE_URL + "/merged-problems.json",
    isMergedProblem
  );

export const fetchProblemPerformances = () =>
  fetchTypedList(
    STATIC_API_BASE_URL + "/problem-performances.json",
    (
      obj: any
    ): obj is {
      problem_id: string;
      minimum_performance: number;
    } =>
      typeof obj.problem_id === "string" &&
      typeof obj.minimum_performance === "number"
  );

export const fetchSolveTimeModels = () =>
  fetchTypedMap(
    STATIC_API_BASE_URL + "/solve_time_models.json",
    isSolveTimeModel
  );

export const fetchUserInfo = (user: string) =>
  user.length > 0
    ? fetch(`${DYNAMIC_API_BASE_URL}/v2/user_info?user=${user}`)
        .then(r => r.json())
        .then(r => {
          if (isUserInfo(r)) {
            return r;
          } else {
            console.error("Invalid UserInfo: ", r);
          }
        })
        .catch(() => undefined)
    : Promise.resolve(undefined);

export const fetchSubmissions = (user: string) =>
  user.length > 0
    ? fetchTypedList(
        `${DYNAMIC_API_BASE_URL}/results?user=${user}`,
        isSubmission
      )
    : Promise.resolve([]);

export const fetchContestHistory = (user: string) =>
  user.length > 0
  ? fetchTypedList(
      `${OFFICIAL_PROXY_BASE_URL}/users/${user}/history/json`,
      isContestParticipation
    ).catch(() => List())
  : Promise.resolve(List());
