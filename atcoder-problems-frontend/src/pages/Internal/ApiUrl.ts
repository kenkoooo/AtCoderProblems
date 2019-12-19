const BASE_URL = "http://localhost/internal-api";

export const USER_GET = `${BASE_URL}/user/get`;
export const USER_UPDATE = `${BASE_URL}/user/update`;

export const contestGetUrl = (contestId: string) =>
  `${BASE_URL}/contest/get/${contestId}`;
export const CONTEST_MY = `${BASE_URL}/contest/my`;
export const CONTEST_UPDATE = `${BASE_URL}/contest/update`;
export const CONTEST_JOIN = `${BASE_URL}/contest/join`;
export const CONTEST_JOINED = `${BASE_URL}/contest/joined`;
export const CONTEST_CREATE = `${BASE_URL}/contest/create`;
export const CONTEST_RECENT = `${BASE_URL}/contest/recent`;
export const CONTEST_ITEM_UPDATE = `${BASE_URL}/contest/item/update`;
