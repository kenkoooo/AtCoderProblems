import Contest from "../interfaces/Contest";
import Problem from "../interfaces/Problem";
import MergedProblem from "../interfaces/MergedProblem";

const BASE_URL = "https://kenkoooo.com/atcoder";
const STATIC_API_BASE_URL = BASE_URL + "/resources";

const AC_COUNT_URL = STATIC_API_BASE_URL + "/ac.json";
const SHORT_COUNT_URL = STATIC_API_BASE_URL + "/short.json";
const FAST_COUNT_URL = STATIC_API_BASE_URL + "/fast.json";
const FIRST_COUNT_URL = STATIC_API_BASE_URL + "/first.json";
const SUM_URL = STATIC_API_BASE_URL + "/sums.json";
const LANG_URL = STATIC_API_BASE_URL + "/lang.json";

interface RankingEntry {
  problem_count: number;
  user_id: string;
}

const fetchRanking = (url: string) =>
  fetch(url)
    .then(r => r.json())
    .then(r => r as RankingEntry[]);

export const fetchACRanking = () => fetchRanking(AC_COUNT_URL);
export const fetchShortRanking = () => fetchRanking(SHORT_COUNT_URL);
export const fetchFastRanking = () => fetchRanking(FAST_COUNT_URL);
export const fetchFirstRanking = () => fetchRanking(FIRST_COUNT_URL);
export const fetchSumRanking = () =>
  fetch(SUM_URL)
    .then(r => r.json())
    .then(
      r =>
        r as {
          user_id: string;
          point_sum: number;
        }[]
    );
export const fetchLangRanking = () =>
  fetch(LANG_URL)
    .then(r => r.json())
    .then(
      r =>
        r as {
          user_id: string;
          count: number;
          language: string;
        }[]
    );

export const fetchContests = () =>
  fetch(STATIC_API_BASE_URL + "/contests.json")
    .then(r => r.json())
    .then(r => r as Contest[]);

export const fetchProblems = () =>
  fetch(STATIC_API_BASE_URL + "/problems.json")
    .then(r => r.json())
    .then(r => r as Problem[]);

export const fetchMergedProblems = () =>
  fetch(STATIC_API_BASE_URL + "/merged-problems.json")
    .then(r => r.json())
    .then(r => r as MergedProblem[]);
