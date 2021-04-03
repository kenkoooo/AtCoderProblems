import Contest, { isContest } from "../interfaces/Contest";
import { isContestParticipation } from "../interfaces/ContestParticipation";
import MergedProblem, { isMergedProblem } from "../interfaces/MergedProblem";
import Problem, { isProblem } from "../interfaces/Problem";
import ProblemModel, { isProblemModel } from "../interfaces/ProblemModel";
import {
  isLangRankingEntry,
  isRankingEntry,
  isStreakRankingEntry,
  isSumRankingEntry,
  LangRankingEntry,
  RankingEntry,
  StreakRankingEntry,
} from "../interfaces/RankingEntry";
import { ContestId, ProblemId, UserId } from "../interfaces/Status";
import { isSubmission } from "../interfaces/Submission";
import { clipDifficulty, isValidResult, isVJudgeOrLuogu } from "../utils";
import { isBlockedProblem } from "../utils/BlockList";
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

function fetchTypedArray<T>(
  url: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  typeGuardFn: (obj: any) => obj is T
): Promise<T[]> {
  return (
    fetch(url)
      .then((r) => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((array: any[]) => array.filter(typeGuardFn))
  );
}

export const useACRanking = () => {
  const url = STATIC_API_BASE_URL + "/ac.json";
  return useSWRData(url, (url) =>
    fetchTypedArray<RankingEntry>(url, isRankingEntry).then((ranking) =>
      ranking.filter((entry) => !isVJudgeOrLuogu(entry.user_id))
    )
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
    fetchTypedArray(url, isMergedProblem)
      .then((problems) => problems.filter((p) => !isBlockedProblem(p.id)))
      .then((problems) =>
        problems.reduce((map, problem) => {
          map.set(problem.id, problem);
          return map;
        }, new Map<ProblemId, MergedProblem>())
      )
  );
};

export const useLangRanking = () => {
  const url = STATIC_API_BASE_URL + "/lang.json";
  return useSWRData(url, (url) =>
    fetchTypedArray(url, isLangRankingEntry).then((ranking) =>
      ranking.reduce((map, entry) => {
        const list = map.get(entry.language) ?? [];
        list.push(entry);
        map.set(
          entry.language,
          list.sort((a, b) => b.count - a.count)
        );
        return map;
      }, new Map<string, LangRankingEntry[]>())
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
  const url = `${ATCODER_API_URL}/results?user=${user}`;
  return useSWRData(url, (url) =>
    user.length > 0
      ? fetchTypedArray(url, isSubmission).then((submissions) =>
          submissions.filter((submission) => isValidResult(submission.result))
        )
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
  return useSWRData(url, (url) => fetchTypedArray(url, isProblem)).data?.filter(
    (problem) => !isBlockedProblem(problem.id)
  );
};

export const useContestToProblems = () => {
  const url = STATIC_API_BASE_URL + "/contest-problem.json";
  const contestIdToProblemIdArray = useSWRData(url, (url) =>
    fetchTypedArray(
      url,
      (obj): obj is { contest_id: ContestId; problem_id: ProblemId } =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        typeof obj.contest_id === "string" && typeof obj.problem_id === "string"
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((obj: { [p: string]: any }) =>
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
