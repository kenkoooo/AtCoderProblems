import { List, Map } from "immutable";
import Submission, { isSubmission } from "../interfaces/Submission";
import { isValidResult } from "./index";

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
