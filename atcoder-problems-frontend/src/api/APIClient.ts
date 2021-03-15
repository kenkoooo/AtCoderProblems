import useSWR from "swr";
import MergedProblem, { isMergedProblem } from "../interfaces/MergedProblem";
import {
  isRankingEntry,
  isStreakRankingEntry,
  isSumRankingEntry,
  RankingEntry,
  StreakRankingEntry,
} from "../interfaces/RankingEntry";
import { ProblemId } from "../interfaces/Status";
import { isVJudgeOrLuogu } from "../utils";
import { isBlockedProblem } from "../utils/BlockList";

const STATIC_API_BASE_URL = "https://kenkoooo.com/atcoder/resources";
const PROXY_API_URL = "https://kenkoooo.com/atcoder/proxy";
const ATCODER_API_URL = process.env.REACT_APP_ATCODER_API_URL;

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

const useStaticData = <T>(
  url: string,
  fetcher: (url: string) => Promise<T>
) => {
  const response = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  const failed = !!response.error;
  const data = response.data;
  return { data, failed };
};

export const useACRanking = () => {
  const url = STATIC_API_BASE_URL + "/ac.json";
  return useStaticData(url, (url) =>
    fetchTypedArray<RankingEntry>(url, isRankingEntry).then((ranking) =>
      ranking.filter((entry) => !isVJudgeOrLuogu(entry.user_id))
    )
  );
};

export const useStreakRanking = () => {
  const url = STATIC_API_BASE_URL + "/streaks.json";
  return useStaticData<RankingEntry[]>(url, (url) =>
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
  return useStaticData<RankingEntry[]>(url, (url) =>
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
  return useStaticData(url, (url) =>
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
