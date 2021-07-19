import { fetchSubmissionsFromDatabaseAndServer } from "../database/SubmissionsDB";
import Contest, { isContest } from "../interfaces/Contest";
import { isContestParticipation } from "../interfaces/ContestParticipation";
import MergedProblem, { isMergedProblem } from "../interfaces/MergedProblem";
import Problem, { isProblem } from "../interfaces/Problem";
import ProblemModel, { isProblemModel } from "../interfaces/ProblemModel";
import {
  isRankingEntryV3,
  isStreakRankingEntry,
  isString,
  isSumRankingEntry,
  RankingEntry,
  RankingEntryV3,
  StreakRankingEntry,
} from "../interfaces/RankingEntry";
import { isUserRankEntry, UserRankEntry } from "../interfaces/UserRankEntry";
import { ContestId, ProblemId, UserId } from "../interfaces/Status";
import { isSubmission } from "../interfaces/Submission";
import {
  clipDifficulty,
  isValidResult,
  isVJudgeOrLuogu,
  hasProperty,
} from "../utils";
import { ratingInfoOf } from "../utils/RatingInfo";
import { useSWRData } from "./index";

const STATIC_API_BASE_URL = "https://kenkoooo.com/atcoder/resources";
const PROXY_API_URL = "https://kenkoooo.com/atcoder/proxy";
const ATCODER_API_URL = process.env.REACT_APP_ATCODER_API_URL;

const generateRanking = (
  mergedProblemMap: Map<ProblemId, MergedProblem>,
  property: "fastest_user_id" | "shortest_user_id" | "first_user_id"
): RankingEntry[] => {
  const countByUser = Array.from(mergedProblemMap.values())
    .map((problem) => problem[property])
    .reduce((map, userId) => {
      if (userId) {
        map.set(userId, (map.get(userId) ?? 0) + 1);
      }
      return map;
    }, new Map<string, number>());

  return Array.from(countByUser.entries()).map(
    ([user_id, problem_count]): RankingEntry => ({
      user_id,
      problem_count,
    })
  );
};

function fetchTypedValue<T>(
  url: string,
  typeGuardFn: (obj: unknown) => obj is T
): Promise<T | undefined> {
  return fetch(url)
    .then((response) => response.json())
    .then((response: unknown) =>
      typeGuardFn(response) ? response : undefined
    );
}

function fetchTypedArray<T>(
  url: string,
  typeGuardFn: (obj: unknown) => obj is T
): Promise<T[]> {
  return fetch(url)
    .then((r) => r.json())
    .then((array: unknown[]) => array.filter(typeGuardFn));
}

export const useACRanking = (from: number, to: number) => {
  const url = `${ATCODER_API_URL}/v3/ac_ranking?from=${from}&to=${to}`;
  return useSWRData(url, (url) =>
    fetchTypedArray<RankingEntryV3>(url, isRankingEntryV3)
      .then((ranking) =>
        ranking.filter((entry) => !isVJudgeOrLuogu(entry.user_id))
      )
      .then((ranking) =>
        ranking.map((entry) => ({
          problem_count: entry.count,
          user_id: entry.user_id,
        }))
      )
  );
};

export const useUserACRank = (user: string) => {
  const url = `${ATCODER_API_URL}/v3/user/ac_rank?user=${encodeURIComponent(
    user
  )}`;
  return useSWRData(url, (url) =>
    fetchTypedValue<UserRankEntry>(url, isUserRankEntry)
  );
};

export const useStreakRanking = () => {
  const url = STATIC_API_BASE_URL + "/streaks.json";
  return useSWRData<RankingEntry[]>(url, (url) =>
    fetchTypedArray<StreakRankingEntry>(url, isStreakRankingEntry).then((x) =>
      x.map((r) => ({
        problem_count: r.streak,
        user_id: r.user_id,
      }))
    )
  );
};

export const useSumRanking = () => {
  const url = STATIC_API_BASE_URL + "/sums.json";
  return useSWRData<RankingEntry[]>(url, (url) =>
    fetchTypedArray(url, isSumRankingEntry)
      .then((x) =>
        x.map((r) => ({
          problem_count: r.point_sum,
          user_id: r.user_id,
        }))
      )
      .then((ranking) =>
        ranking.filter((entry) => !isVJudgeOrLuogu(entry.user_id))
      )
  );
};

export const useMergedProblemMap = () => {
  const url = STATIC_API_BASE_URL + "/merged-problems.json";
  return useSWRData(url, (url) =>
    fetchTypedArray(url, isMergedProblem).then((problems) =>
      problems.reduce((map, problem) => {
        map.set(problem.id, problem);
        return map;
      }, new Map<ProblemId, MergedProblem>())
    )
  );
};

export const useLangList = () => {
  const url = `${ATCODER_API_URL}/v3/language_list`;
  return useSWRData(url, (url) => fetchTypedArray(url, isString));
};

export const useOneLangRanking = (
  from: number,
  to: number,
  language: string
) => {
  const url = `${ATCODER_API_URL}/v3/language_ranking?from=${from}&to=${to}&language=${encodeURIComponent(
    language
  )}`;
  return useSWRData(url, (url) =>
    fetchTypedArray(url, isRankingEntryV3).then((ranking) =>
      ranking.map((entry) => ({
        problem_count: entry.count,
        user_id: entry.user_id,
      }))
    )
  );
};

export const useShortRanking = () => {
  const map = useMergedProblemMap().data;
  return map ? generateRanking(map, "shortest_user_id") : undefined;
};
export const useFastRanking = () => {
  const map = useMergedProblemMap().data;
  return map ? generateRanking(map, "fastest_user_id") : undefined;
};
export const useFirstRanking = () => {
  const map = useMergedProblemMap().data;
  return map ? generateRanking(map, "first_user_id") : undefined;
};

export const useRatingInfo = (user: string) => {
  const url = `${PROXY_API_URL}/users/${user}/history/json`;
  const history =
    useSWRData(url, (url) => fetchTypedArray(url, isContestParticipation))
      ?.data ?? [];
  return ratingInfoOf(history);
};

export const useUserSubmission = (user: string) => {
  const fetcher = (url: string) => {
    const userId = url.split(" ")[0];
    return fetchSubmissionsFromDatabaseAndServer(userId);
  };
  return useSWRData(`${user} submission`, (url) =>
    user.length > 0
      ? fetcher(url).then((ss) => ss.filter((s) => isValidResult(s.result)))
      : Promise.resolve([])
  ).data;
};

export const useMultipleUserSubmissions = (userIds: UserId[]) => {
  const fetcher = async (urls: string[]) => {
    const promises = urls.map((url) => fetchTypedArray(url, isSubmission));
    const arrays = await Promise.all(promises);
    return arrays.flat();
  };

  const urls = userIds
    .filter((userId) => userId.length > 0)
    .map((userId) => `${ATCODER_API_URL}/results?user=${userId}`);
  return useSWRData(urls.join(","), (urls) => fetcher(urls.split(",")));
};

export const useContests = () => {
  const url = STATIC_API_BASE_URL + "/contests.json";
  return useSWRData(url, (url) => fetchTypedArray(url, isContest));
};

export const useProblems = () => {
  const url = STATIC_API_BASE_URL + "/problems.json";
  return useSWRData(url, (url) => fetchTypedArray(url, isProblem)).data;
};

export const useContestToProblems = () => {
  const url = STATIC_API_BASE_URL + "/contest-problem.json";
  const contestIdToProblemIdArray = useSWRData(url, (url) =>
    fetchTypedArray(
      url,
      (obj): obj is { contest_id: ContestId; problem_id: ProblemId } =>
        hasProperty(obj, "contest_id") &&
        typeof obj.contest_id === "string" &&
        hasProperty(obj, "problem_id") &&
        typeof obj.problem_id === "string"
    )
  );
  const problemMap = useProblemMap();
  return contestIdToProblemIdArray.data?.reduce(
    (map, { contest_id, problem_id }) => {
      const problem = problemMap?.get(problem_id);
      if (problem) {
        const problems = map.get(contest_id) ?? [];
        problems.push(problem);
        map.set(contest_id, problems);
      }
      return map;
    },
    new Map<ContestId, Problem[]>()
  );
};

export const useContestMap = () => {
  const contests = useContests().data;
  return contests?.reduce((map, contest) => {
    map.set(contest.id, contest);
    return map;
  }, new Map<ContestId, Contest>());
};

export const useProblemMap = () => {
  const problems = useProblems();
  return problems?.reduce((map, problem) => {
    map.set(problem.id, problem);
    return map;
  }, new Map<ProblemId, Problem>());
};

export const useProblemModelMap = () => {
  const fetcher = (url: string) =>
    fetch(url)
      .then((r) => r.json())
      .then((obj: { [p: string]: unknown }) =>
        Object.entries(obj)
          .filter((entry): entry is [string, ProblemModel] =>
            isProblemModel(entry[1])
          )
          .reduce((map, [problemId, problemModel]) => {
            if (problemModel.difficulty === undefined) {
              map.set(problemId, problemModel);
            } else {
              map.set(problemId, {
                ...problemModel,
                difficulty: clipDifficulty(problemModel.difficulty),
                rawDifficulty: problemModel.difficulty,
              });
            }
            return map;
          }, new Map<ProblemId, ProblemModel>())
      );
  const url = STATIC_API_BASE_URL + "/problem-models.json";
  return useSWRData(url, fetcher).data;
};

export const useVirtualContestSubmissions = (
  users: UserId[],
  problems: ProblemId[],
  fromSecond: number,
  toSecond: number,
  refreshInterval: number
) => {
  const userList = users.join(",");
  const problemList = problems.join(",");
  const url = `${ATCODER_API_URL}/v3/users_and_time?users=${userList}&problems=${problemList}&from=${fromSecond}&to=${toSecond}`;
  return useSWRData(
    url,
    (url) =>
      userList.length > 0
        ? fetchTypedArray(url, isSubmission).then((submissions) =>
            submissions.filter((submission) => isValidResult(submission.result))
          )
        : Promise.resolve([]),
    {
      refreshInterval,
    }
  ).data;
};
