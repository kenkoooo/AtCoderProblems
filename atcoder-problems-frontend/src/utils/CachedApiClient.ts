import { List, Map, Set } from "immutable";
import { ContestId, ProblemId } from "../interfaces/Status";
import ProblemModel, { isProblemModel } from "../interfaces/ProblemModel";
import Contest, { isContest } from "../interfaces/Contest";
import Problem, { isProblem } from "../interfaces/Problem";
import Submission, { isSubmission } from "../interfaces/Submission";
import ContestParticipation, {
  isContestParticipation,
} from "../interfaces/ContestParticipation";
import { RatingInfo, ratingInfoOf } from "./RatingInfo";
import { isBlockedProblem } from "./BlockList";
import { clipDifficulty, isValidResult } from "./index";

const STATIC_API_BASE_URL = "https://kenkoooo.com/atcoder/resources";
const PROXY_API_URL = "https://kenkoooo.com/atcoder/proxy";
const ATCODER_API_URL = process.env.REACT_APP_ATCODER_API_URL;

function fetchTypedList<T>(
  url: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  typeGuardFn: (obj: any) => obj is T
): Promise<List<T>> {
  return (
    fetch(url)
      .then((r) => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((array: any[]) => array.filter(typeGuardFn))
      .then((array) => List(array))
  );
}

function fetchTypedMap<V>(
  url: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  typeGuardFn: (obj: any) => obj is V
): Promise<Map<string, V>> {
  return (
    fetch(url)
      .then((r) => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((obj: { [p: string]: any }) => Map(obj))
      .then((m) => m.filter(typeGuardFn))
  );
}

const fetchContestProblemPairs = (): Promise<
  List<{
    contest_id: string;
    problem_id: string;
  }>
> =>
  fetchTypedList(
    STATIC_API_BASE_URL + "/contest-problem.json",
    (obj): obj is { contest_id: string; problem_id: string } =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      typeof obj.contest_id === "string" && typeof obj.problem_id === "string"
  );

const fetchContests = (): Promise<List<Contest>> =>
  fetchTypedList(STATIC_API_BASE_URL + "/contests.json", isContest);

const fetchProblems = (): Promise<List<Problem>> =>
  fetchTypedList(STATIC_API_BASE_URL + "/problems.json", isProblem);

const fetchProblemModels = (): Promise<Map<string, ProblemModel>> =>
  fetchTypedMap(
    STATIC_API_BASE_URL + "/problem-models.json",
    isProblemModel
  ).then((map) =>
    map.map(
      (model: ProblemModel): ProblemModel => {
        if (model.difficulty === undefined) {
          return model;
        }
        return {
          ...model,
          difficulty: clipDifficulty(model.difficulty),
          rawDifficulty: model.difficulty,
        };
      }
    )
  );

const fetchSubmissions = (user: string): Promise<List<Submission>> =>
  user.length > 0
    ? fetchTypedList(`${ATCODER_API_URL}/results?user=${user}`, isSubmission)
    : Promise.resolve(List<Submission>()).then((submissions) =>
        submissions.filter((s) => isValidResult(s.result))
      );

const fetchRatingInfo = async (user: string): Promise<RatingInfo> => {
  const history =
    user.length > 0
      ? await fetchTypedList(
          `${PROXY_API_URL}/users/${user}/history/json`,
          isContestParticipation
        ).catch(() => List<ContestParticipation>())
      : List<ContestParticipation>();
  return ratingInfoOf(history);
};

const fetchContestMap = (): Promise<Map<string, Contest>> =>
  fetchContests().then((contests) =>
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
    return Promise.resolve(List<Submission>());
  }

  const userList = users.join(",");
  const problemList = problems.join(",");
  const url = `${ATCODER_API_URL}/v3/users_and_time?users=${userList}&problems=${problemList}&from=${fromSecond}&to=${toSecond}`;
  return fetchTypedList(url, isSubmission);
};

let CACHED_PROBLEM_MODELS: undefined | Promise<Map<ProblemId, ProblemModel>>;
export const cachedProblemModels = (): Promise<Map<string, ProblemModel>> => {
  if (CACHED_PROBLEM_MODELS === undefined) {
    CACHED_PROBLEM_MODELS = fetchProblemModels();
  }
  return CACHED_PROBLEM_MODELS;
};

let CACHED_CONTESTS: undefined | Promise<Map<ContestId, Contest>>;
export const cachedContestMap = (): Promise<Map<string, Contest>> => {
  if (CACHED_CONTESTS === undefined) {
    CACHED_CONTESTS = fetchContestMap();
  }
  return CACHED_CONTESTS;
};

let CACHED_PROBLEMS: undefined | Promise<Map<ProblemId, Problem>>;
export const cachedProblemMap = (): Promise<Map<string, Problem>> => {
  if (CACHED_PROBLEMS === undefined) {
    CACHED_PROBLEMS = fetchProblems()
      .then((problems) => problems.filter((p) => !isBlockedProblem(p.id)))
      .then((problems) =>
        problems.reduce(
          (map, problem) => map.set(problem.id, problem),
          Map<string, Problem>()
        )
      );
  }
  return CACHED_PROBLEMS;
};

const fetchContestToProblemMap = async (): Promise<
  Map<string, List<Problem>>
> => {
  const pairs = await fetchContestProblemPairs();
  const problems = await cachedProblemMap();
  return pairs
    .map(({ contest_id, problem_id }) => ({
      contest_id,
      problem: problems.get(problem_id),
    }))
    .reduce((map, { contest_id, problem }) => {
      if (problem === undefined) {
        return map;
      } else {
        return map.update(contest_id, List<Problem>(), (list) =>
          list.push(problem)
        );
      }
    }, Map<ContestId, List<Problem>>());
};

let CACHED_CONTEST_TO_PROBLEM:
  | undefined
  | Promise<Map<ContestId, List<Problem>>>;
export const cachedContestToProblemMap = (): Promise<
  Map<string, List<Problem>>
> => {
  if (CACHED_CONTEST_TO_PROBLEM === undefined) {
    CACHED_CONTEST_TO_PROBLEM = fetchContestToProblemMap();
  }
  return CACHED_CONTEST_TO_PROBLEM;
};

let SUBMISSION_MAP = Map<string, Promise<List<Submission>>>();
export const cachedSubmissions = (user: string): Promise<List<Submission>> => {
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
    users.toArray().map((user) => cachedSubmissions(user))
  ).then((lists) =>
    lists.reduce(
      (map, submissions) =>
        submissions.reduce(
          (m, s) =>
            m.update(s.problem_id, List<Submission>(), (list) => list.push(s)),
          map
        ),
      Map<ProblemId, List<Submission>>()
    )
  );

const SELECTABLE_LANGUAGES: {
  userId: string;
  selectableLanguages: Promise<Set<string>> | undefined;
} = { userId: "", selectableLanguages: undefined };
export const cachedSelectableLanguages = (
  userId: string
): Promise<Set<string>> => {
  if (
    SELECTABLE_LANGUAGES.selectableLanguages === undefined ||
    SELECTABLE_LANGUAGES.userId !== userId
  ) {
    SELECTABLE_LANGUAGES.userId = userId;
    SELECTABLE_LANGUAGES.selectableLanguages = cachedSubmissions(
      userId
    ).then((submissions) => submissions.map((s) => s.language).toSet());
  }
  return SELECTABLE_LANGUAGES.selectableLanguages;
};

let RATING_INFO_MAP = Map<string, Promise<RatingInfo>>();
export const cachedRatingInfo = (user: string): Promise<RatingInfo> => {
  const info = RATING_INFO_MAP.get(user);
  if (info) {
    return info;
  }
  const p = fetchRatingInfo(user);
  RATING_INFO_MAP = RATING_INFO_MAP.set(user, p);
  return p;
};
