import {
  ProblemList,
  ProgressResetList,
  UserResponse,
  VirtualContestDetails,
  VirtualContestInfo,
} from "../pages/Internal/types";
import { useSWRData } from "./index";

const BASE_URL = process.env.REACT_APP_INTERNAL_API_URL;
export const USER_GET = `${BASE_URL}/user/get`;

const typeCastFetcher = <T>(url: string) =>
  fetch(url)
    .then((response) => response.json())
    .then((response) => response as T);

export const useLoginState = () => {
  return useSWRData(USER_GET, (url) => typeCastFetcher<UserResponse>(url));
};

export const useVirtualContest = (contestId: string) => {
  const url = `${BASE_URL}/contest/get/${contestId}`;
  return useSWRData(url, (url) => typeCastFetcher<VirtualContestDetails>(url));
};

export const useMyContests = () => {
  return useSWRData(`${BASE_URL}/contest/my`, (url) =>
    typeCastFetcher<VirtualContestInfo[]>(url)
  );
};
export const useJoinedContests = () => {
  return useSWRData(`${BASE_URL}/contest/joined`, (url) =>
    typeCastFetcher<VirtualContestInfo[]>(url)
  );
};

export const useProblemList = (listId: string) => {
  return useSWRData(`${BASE_URL}/list/get/${listId}`, (url) =>
    typeCastFetcher<ProblemList>(url)
  );
};

export const useProgressResetList = () => {
  return useSWRData(`${BASE_URL}/progress_reset/list`, (url) =>
    typeCastFetcher<ProgressResetList>(url)
  );
};

export const useRecentContests = () => {
  return useSWRData(`${BASE_URL}/contest/recent`, (url) =>
    typeCastFetcher<VirtualContestInfo[]>(url)
  );
};

export const useMyList = () => {
  return useSWRData(`${BASE_URL}/list/my`, (url) =>
    typeCastFetcher<ProblemList[]>(url)
  );
};
