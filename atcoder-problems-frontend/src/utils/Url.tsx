const BASE_URL = "https://atcoder.jp";

const CLIENT_ID = "162a5276634fc8b970f7";
const AUTHORIZATION_CALLBACK_URL =
  "https://kenkoooo.com/atcoder/internal-api/authorize";

export const formatContestUrl = (contest: string): string =>
  `${BASE_URL}/contests/${contest}`;

export const formatSubmissionUrl = (id: number, contest: string): string =>
  `${formatContestUrl(contest)}/submissions/${id}`;

export const formatProblemUrl = (problem: string, contest: string): string =>
  `${formatContestUrl(contest)}/tasks/${problem}`;

export const formatSolversUrl = (contest: string, problem: string): string =>
  `${formatContestUrl(contest)}/submissions?f.Task=${problem}&f.Status=AC`;

export const formatUserUrl = (userId: string): string =>
  `https://atcoder.jp/users/${userId}`;

export const useLoginLink = (): string => {
  const currentPath = location.hash.slice(1);
  const redirectUri = `${AUTHORIZATION_CALLBACK_URL}?redirect_to=${encodeURIComponent(
    currentPath
  )}`;
  const loginLink = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}`;
  return loginLink;
};
