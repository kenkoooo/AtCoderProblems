import { List, Map } from "immutable";
import { ProblemId } from "../interfaces/Status";
import ProblemModel, { isProblemModel } from "../interfaces/ProblemModel";
import Problem, { isProblem } from "../interfaces/Problem";
import Submission, { isSubmission } from "../interfaces/Submission";
import { isBlockedProblem } from "./BlockList";
import { clipDifficulty, isValidResult } from "./index";

const STATIC_API_BASE_URL = "https://kenkoooo.com/atcoder/resources";
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
