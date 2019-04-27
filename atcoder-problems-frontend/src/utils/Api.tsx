import Contest from '../interfaces/Contest';
import Problem from '../interfaces/Problem';
import MergedProblem from '../interfaces/MergedProblem';
import UserInfo from '../interfaces/UserInfo';
import Submission from '../interfaces/Submission';

const BASE_URL = 'https://kenkoooo.com/atcoder';
const STATIC_API_BASE_URL = BASE_URL + '/resources';
const DYNAMIC_API_BASE_URL = BASE_URL + '/atcoder-api';

const AC_COUNT_URL = STATIC_API_BASE_URL + '/ac.json';
const SUM_URL = STATIC_API_BASE_URL + '/sums.json';
const LANG_URL = STATIC_API_BASE_URL + '/lang.json';

interface RankingEntry {
	problem_count: number;
	user_id: string;
}

const generateRanking = (problems: MergedProblem[], property: "fastest_user_id" | "shortest_user_id" | "first_user_id") => {
	const map = problems.reduce((map, problem) => {
		const user_id = problem[property];
		if (user_id) {
			const count = map.get(user_id);
			if (count) {
				return map.set(user_id, count + 1);
			} else {
				return map.set(user_id, 1);
			}
		} else {
			return map;
		}
	}, new Map<string, number>());
	return Array.from(map).map(([user_id, problem_count]) => ({ user_id, problem_count }));
};

export const getShortRanking = (problems: MergedProblem[]) => generateRanking(problems, "shortest_user_id");
export const getFastRanking = (problems: MergedProblem[]) => generateRanking(problems, "fastest_user_id");
export const getFirstRanking = (problems: MergedProblem[]) => generateRanking(problems, "first_user_id");


export const fetchACRanking = () => fetch(AC_COUNT_URL).then((r) => r.json()).then((r) => r as RankingEntry[]);

export const fetchSumRanking = () =>
	fetch(SUM_URL).then((r) => r.json()).then(
		(r) =>
			r as {
				user_id: string;
				point_sum: number;
			}[]
	);

export const fetchLangRanking = () =>
	fetch(LANG_URL).then((r) => r.json()).then(
		(r) =>
			r as {
				user_id: string;
				count: number;
				language: string;
			}[]
	);

export const fetchContests = () =>
	fetch(STATIC_API_BASE_URL + '/contests.json').then((r) => r.json()).then((r) => r as Contest[]);
export const fetchProblems = () =>
	fetch(STATIC_API_BASE_URL + '/problems.json').then((r) => r.json()).then((r) => r as Problem[]);
export const fetchMergedProblems = () =>
	fetch(STATIC_API_BASE_URL + '/merged-problems.json').then((r) => r.json()).then((r) => r as MergedProblem[]);
export const fetchUserInfo = (user: string) =>
	fetch(`${DYNAMIC_API_BASE_URL}/v2/user_info?user=${user}`).then((r) => r.json()).then((info) => info as UserInfo);
export const fetchSubmissions = (user: string) =>
	fetch(`${DYNAMIC_API_BASE_URL}/results?user=${user}`).then((r) => r.json()).then((r) => r as Submission[]);
