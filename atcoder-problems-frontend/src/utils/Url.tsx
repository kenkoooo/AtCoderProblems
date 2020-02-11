const BASE_URL = "https://atcoder.jp";

export const formatContestUrl = (contest: string) =>
  `${BASE_URL}/contests/${contest}`;

export const formatSubmissionUrl = (id: number, contest: string) =>
  `${formatContestUrl(contest)}/submissions/${id}`;

export const formatProblemUrl = (problem: string, contest: string) =>
  `${formatContestUrl(contest)}/tasks/${problem}`;

export const formatSolversUrl = (contest: string, problem: string) =>
  `${formatContestUrl(contest)}/submissions?f.Task=${problem}&f.Status=AC`;

export const GITHUB_LOGIN_LINK =
  "https://github.com/login/oauth/authorize?client_id=162a5276634fc8b970f7";
