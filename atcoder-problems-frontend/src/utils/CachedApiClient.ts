import { ContestId, ProblemId } from "../interfaces/Status";
import MergedProblem, { isMergedProblem } from "../interfaces/MergedProblem";
import { List, Map, Set } from "immutable";
import ProblemModel, { isProblemModel } from "../interfaces/ProblemModel";
import Contest, { isContest } from "../interfaces/Contest";
import Problem, { isProblem } from "../interfaces/Problem";
import Submission, { isSubmission } from "../interfaces/Submission";
import {
  isLangRankingEntry,
  isRankingEntry,
  isStreakRankingEntry,
  isSumRankingEntry,
  LangRankingEntry,
  RankingEntry
} from "../interfaces/RankingEntry";
import { RatingInfo, ratingInfoOf } from "./RatingInfo";
import { clipDifficulty, isValidResult, isVJudgeOrLuogu } from "./index";
import ContestParticipation, {
  isContestParticipation
} from "../interfaces/ContestParticipation";
import { isBlockedProblem } from "./BlockList";

const STATIC_API_BASE_URL = "https://kenkoooo.com/atcoder/resources";
const PROXY_API_URL = "https://kenkoooo.com/atcoder/proxy";
const ATCODER_API_URL = process.env.REACT_APP_ATCODER_API_URL;

function fetchTypedList<T>(url: string, typeGuardFn: (obj: any) => obj is T) {
  return fetch(url)
    .then(r => r.json())
    .then((array: any[]) => array.filter(typeGuardFn))
    .then(array => List(array));
}

function fetchTypedArray<T>(url: string, typeGuardFn: (obj: any) => obj is T) {
  return fetch(url)
    .then(r => r.json())
    .then((array: any[]) => array.filter(typeGuardFn));
}

function fetchTypedMap<V>(url: string, typeGuardFn: (obj: any) => obj is V) {
  return fetch(url)
    .then(r => r.json())
    .then((obj: { [p: string]: any }) => Map(obj))
    .then(m => m.filter(typeGuardFn));
}

const fetchContestProblemPairs = () =>
  fetchTypedList(
    STATIC_API_BASE_URL + "/contest-problem.json",
    (obj: any): obj is { contest_id: string; problem_id: string } =>
      typeof obj.contest_id === "string" && typeof obj.problem_id === "string"
  );

const fetchContests = () =>
  fetchTypedList(STATIC_API_BASE_URL + "/contests.json", isContest);

const fetchProblems = () =>
  fetchTypedList(STATIC_API_BASE_URL + "/problems.json", isProblem);

const fetchMergedProblems = () =>
  fetchTypedList(
    STATIC_API_BASE_URL + "/merged-problems.json",
    isMergedProblem
  );

const fetchProblemModels = () =>
  fetchTypedMap(
    STATIC_API_BASE_URL + "/problem-models.json",
    isProblemModel
  ).then(map =>
    map.map(
      (model: ProblemModel): ProblemModel => {
        if (model.difficulty === undefined) {
          return model;
        }
        return {
          ...model,
          difficulty: clipDifficulty(model.difficulty),
          rawDifficulty: model.difficulty
        };
      }
    )
  );

const fetchSubmissions = (user: string) =>
  user.length > 0
    ? fetchTypedList(`${ATCODER_API_URL}/results?user=${user}`, isSubmission)
    : Promise.resolve(List<Submission>()).then(submissions =>
        submissions.filter(s => isValidResult(s.result))
      );

const fetchRatingInfo = async (user: string) => {
  const history =
    user.length > 0
      ? await fetchTypedList(
          `${PROXY_API_URL}/users/${user}/history/json`,
          isContestParticipation
        ).catch(() => List<ContestParticipation>())
      : List<ContestParticipation>();
  return ratingInfoOf(history);
};

const fetchStreaks = () =>
  fetchTypedArray(STATIC_API_BASE_URL + "/streaks.json", isStreakRankingEntry);

const fetchContestMap = () =>
  fetchContests().then(contests =>
    contests.reduce(
      (map, contest) => map.set(contest.id, contest),
      Map<string, Contest>()
    )
  );

export const fetchVirtualContestSubmission = (
  users: string[],
  problems: string[],
  fromSecond: number,
  toSecond: number
): Promise<List<Submission>> => {
  if (users.length === 0) {
    return Promise.resolve(List());
  }

  const userList = users.join(",");
  const problemList = problems.join(",");
  const url = `${ATCODER_API_URL}/v3/users_and_time?users=${userList}&problems=${problemList}&from=${fromSecond}&to=${toSecond}`;
  return fetchTypedList(url, isSubmission);
};

let MERGED_PROBLEMS: Promise<List<MergedProblem>> | undefined;
const cachedMergedProblems = () => {
  if (MERGED_PROBLEMS === undefined) {
    MERGED_PROBLEMS = fetchMergedProblems().then(problems =>
      problems.filter(p => !isBlockedProblem(p.id))
    );
  }
  return MERGED_PROBLEMS;
};

let CACHED_MERGED_PROBLEM_MAP:
  | Promise<Map<ProblemId, MergedProblem>>
  | undefined;
export const cachedMergedProblemMap = () => {
  if (CACHED_MERGED_PROBLEM_MAP === undefined) {
    CACHED_MERGED_PROBLEM_MAP = cachedMergedProblems().then(list =>
      list.reduce(
        (map, problem) => map.set(problem.id, problem),
        Map<string, MergedProblem>()
      )
    );
  }
  return CACHED_MERGED_PROBLEM_MAP;
};

let CACHED_PROBLEM_MODELS: undefined | Promise<Map<ProblemId, ProblemModel>>;
export const cachedProblemModels = () => {
  if (CACHED_PROBLEM_MODELS === undefined) {
    CACHED_PROBLEM_MODELS = fetchProblemModels();
    CACHED_PROBLEM_MODELS.then(value =>
      localStorage.setItem(
        "problemModels",
        JSON.stringify(Array.from(value.entries()))
      )
    );
  }
  return CACHED_PROBLEM_MODELS;
};
export const oldProblemModels = () => {
  return Map<ProblemId, ProblemModel>(
    JSON.parse(localStorage.getItem("problemModels") || "[]") as Array<
      [ProblemId, ProblemModel]
    >
  );
};

let CACHED_CONTESTS: undefined | Promise<Map<ContestId, Contest>>;
export const cachedContestMap = () => {
  if (CACHED_CONTESTS === undefined) {
    CACHED_CONTESTS = fetchContestMap();
  }
  return CACHED_CONTESTS;
};

let CACHED_PROBLEMS: undefined | Promise<Map<ProblemId, Problem>>;
export const cachedProblemMap = () => {
  if (CACHED_PROBLEMS === undefined) {
    CACHED_PROBLEMS = fetchProblems()
      .then(problems => problems.filter(p => !isBlockedProblem(p.id)))
      .then(problems =>
        problems.reduce(
          (map, problem) => map.set(problem.id, problem),
          Map<string, Problem>()
        )
      );
  }
  return CACHED_PROBLEMS;
};

const fetchContestToProblemMap = async () => {
  const pairs = await fetchContestProblemPairs();
  const problems = await cachedProblemMap();
  return pairs
    .map(({ contest_id, problem_id }) => ({
      contest_id,
      problem: problems.get(problem_id)
    }))
    .reduce((map, { contest_id, problem }) => {
      if (problem === undefined) {
        return map;
      } else {
        return map.update(contest_id, List<Problem>(), list =>
          list.push(problem)
        );
      }
    }, Map<ContestId, List<Problem>>());
};

let CACHED_CONTEST_TO_PROBLEM:
  | undefined
  | Promise<Map<ContestId, List<Problem>>>;
export const cachedContestToProblemMap = () => {
  if (CACHED_CONTEST_TO_PROBLEM === undefined) {
    CACHED_CONTEST_TO_PROBLEM = fetchContestToProblemMap();
  }
  return CACHED_CONTEST_TO_PROBLEM;
};

let SUBMISSION_MAP = Map<string, Promise<List<Submission>>>();
export const cachedSubmissions = (user: string) => {
  const cache = SUBMISSION_MAP.get(user);
  if (cache) {
    return cache;
  }
  const submissions = fetchSubmissions(user);
  SUBMISSION_MAP = SUBMISSION_MAP.set(user, submissions);
  return submissions;
};
export const cachedUsersSubmissionMap = (
  users: List<string>
): Promise<Map<ProblemId, List<Submission>>> =>
  Promise.all(
    users.toArray().map(user => cachedSubmissions(user))
  ).then(lists =>
    lists.reduce(
      (map, submissions) =>
        submissions.reduce(
          (m, s) =>
            m.update(s.problem_id, List<Submission>(), list => list.push(s)),
          map
        ),
      Map<ProblemId, List<Submission>>()
    )
  );

let STREAK_RANKING: Promise<RankingEntry[]> | undefined;
export const cachedStreaksRanking = () => {
  if (STREAK_RANKING === undefined) {
    STREAK_RANKING = fetchStreaks().then(x =>
      x.map(r => ({
        problem_count: r.streak,
        user_id: r.user_id
      }))
    );
  }
  return STREAK_RANKING;
};

let AC_RANKING: Promise<RankingEntry[]> | undefined;
export const cachedACRanking = () => {
  if (AC_RANKING === undefined) {
    AC_RANKING = fetchTypedArray(
      STATIC_API_BASE_URL + "/ac.json",
      isRankingEntry
    ).then(ranking => ranking.filter(entry => !isVJudgeOrLuogu(entry.user_id)));
  }
  return AC_RANKING;
};

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
      ([i, c]): RankingEntry => {
        return { user_id: i, problem_count: c };
      }
    )
    .toList();

export const cachedShortRanking = () =>
  cachedMergedProblems().then(list =>
    generateRanking(list, "shortest_user_id")
  );
export const cachedFastRanking = () =>
  cachedMergedProblems().then(list => generateRanking(list, "fastest_user_id"));
export const cachedFirstRanking = () =>
  cachedMergedProblems().then(list => generateRanking(list, "first_user_id"));

let LANGUAGE_RANKING: undefined | Promise<Map<string, List<LangRankingEntry>>>;
export const cachedLangRanking = () => {
  if (LANGUAGE_RANKING === undefined) {
    LANGUAGE_RANKING = fetchTypedList(
      STATIC_API_BASE_URL + "/lang.json",
      isLangRankingEntry
    ).then(ranking =>
      ranking
        .reduce(
          (map, entry) =>
            map.update(entry.language, List<LangRankingEntry>(), list =>
              list.push(entry)
            ),
          Map<string, List<LangRankingEntry>>()
        )
        .map(list => list.sort((a, b) => b.count - a.count))
    );
  }
  return LANGUAGE_RANKING;
};

const SELECTABLE_LANGUAGES: {
  userId: string;
  selectableLanguages: Promise<Set<string>> | undefined;
} = { userId: "", selectableLanguages: undefined };
export const cachedSelectableLanguages = (userId: string) => {
  if (
    SELECTABLE_LANGUAGES.selectableLanguages === undefined ||
    SELECTABLE_LANGUAGES.userId !== userId
  ) {
    SELECTABLE_LANGUAGES.userId = userId;
    SELECTABLE_LANGUAGES.selectableLanguages = cachedSubmissions(
      userId
    ).then(submissions => submissions.map(s => s.language).toSet());
  }
  return SELECTABLE_LANGUAGES.selectableLanguages;
};

let SUM_RANKING: undefined | Promise<RankingEntry[]>;
export const cachedSumRanking = () => {
  if (SUM_RANKING === undefined) {
    SUM_RANKING = fetchTypedArray(
      STATIC_API_BASE_URL + "/sums.json",
      isSumRankingEntry
    )
      .then(ranking =>
        ranking.map(r => ({
          problem_count: r.point_sum,
          user_id: r.user_id
        }))
      )
      .then(ranking =>
        ranking.filter(entry => !isVJudgeOrLuogu(entry.user_id))
      );
  }
  return SUM_RANKING;
};

const RATING_INFO_MAP = Map<string, Promise<RatingInfo>>();
export const cachedRatingInfo = (user: string) => {
  const info = RATING_INFO_MAP.get(user);
  if (info) {
    return info;
  }
  const p = fetchRatingInfo(user);
  RATING_INFO_MAP.set(user, p);
  return p;
};
