import Contest from "../interfaces/Contest";
import Problem from "../interfaces/Problem";
import MergedProblem from "../interfaces/MergedProblem";
import UserInfo from "../interfaces/UserInfo";
import Submission from "../interfaces/Submission";
import { List, Map } from "immutable";

const BASE_URL = "https://kenkoooo.com/atcoder";
const STATIC_API_BASE_URL = BASE_URL + "/resources";
const DYNAMIC_API_BASE_URL = BASE_URL + "/atcoder-api";

const AC_COUNT_URL = STATIC_API_BASE_URL + "/ac.json";
const SUM_URL = STATIC_API_BASE_URL + "/sums.json";
const LANG_URL = STATIC_API_BASE_URL + "/lang.json";

interface RankingEntry {
  problem_count: number;
  user_id: string;
}

const generateRanking = (
  problems: List<MergedProblem>,
  property: "fastest_user_id" | "shortest_user_id" | "first_user_id"
) => {
  const map = problems.reduce((map, problem) => {
    const user_id = problem[property];
    return user_id ? map.set(user_id, map.get(user_id, 0) + 1) : map;
  }, Map<string, number>());
  return Array.from(map).map(([user_id, problem_count]) => ({
    user_id,
    problem_count
  }));
};

export const getShortRanking = (problems: List<MergedProblem>) =>
  generateRanking(problems, "shortest_user_id");
export const getFastRanking = (problems: List<MergedProblem>) =>
  generateRanking(problems, "fastest_user_id");
export const getFirstRanking = (problems: List<MergedProblem>) =>
  generateRanking(problems, "first_user_id");

export const fetchACRanking = () => fetchJson<RankingEntry[]>(AC_COUNT_URL);

export const fetchSumRanking = () =>
  fetchJson<
    {
      user_id: string;
      point_sum: number;
    }[]
  >(SUM_URL);

export const fetchLangRanking = () =>
  fetchJson<
    {
      user_id: string;
      count: number;
      language: string;
    }[]
  >(LANG_URL);
export const fetchContestProblemPairs = () =>
  fetchJson<{ contest_id: string; problem_id: string }[]>(
    STATIC_API_BASE_URL + "/contest-problem.json"
  ).then(pairs => List(pairs));
export const fetchContests = () =>
  fetchJson<Contest[]>(STATIC_API_BASE_URL + "/contests.json").then(contests =>
    List(contests)
  );
export const fetchProblems = () =>
  fetchJson<Problem[]>(STATIC_API_BASE_URL + "/problems.json").then(problems =>
    List(problems)
  );
export const fetchMergedProblems = () =>
  fetchJson<MergedProblem[]>(
    STATIC_API_BASE_URL + "/merged-problems.json"
  ).then(problems => List(problems));
export const fetchProblemPerformances = () =>
  fetchJson<
    {
      problem_id: string;
      minimum_performance: number;
    }[]
  >(STATIC_API_BASE_URL + "/problem-performances.json");
export const fetchUserInfo = (user: string) =>
  user.length > 0
    ? fetchJson<UserInfo | undefined>(
        `${DYNAMIC_API_BASE_URL}/v2/user_info?user=${user}`
      )
    : Promise.resolve(undefined);
export const fetchSubmissions = (user: string) =>
  user.length > 0
    ? fetchJson<Submission[]>(`${DYNAMIC_API_BASE_URL}/results?user=${user}`)
    : Promise.resolve([]);

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  const json = await r.json();
  return json as T;
}
