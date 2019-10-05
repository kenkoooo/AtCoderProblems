const BASE_URL = 'https://atcoder.jp';

export const formatContestUrl = (contest: string) => `${BASE_URL}/contests/${contest}`;

export const formatSubmissionUrl = (id: number, contest: string) => `${formatContestUrl(contest)}/submissions/${id}`;

export const formatProblemUrl = (problem: string, contest: string) => `${formatContestUrl(contest)}/tasks/${problem}`;

export const formatSolversUrl = (contest: string, problem: string) =>
	`${formatContestUrl(contest)}/submissions?f.Task=${problem}&f.Status=AC`;

export const formatUserUrl = (user: string) => `${BASE_URL}/users/${user}`;

export const formatAtCoderProblemsUserPageUrl = (user: string) => `https://kenkoooo.com/atcoder/#/user/${user}`;
