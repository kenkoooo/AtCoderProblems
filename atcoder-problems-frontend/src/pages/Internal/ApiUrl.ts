const BASE_URL = process.env.REACT_APP_INTERNAL_API_URL;

export const USER_UPDATE = `${BASE_URL}/user/update`;

export const CONTEST_UPDATE = `${BASE_URL}/contest/update`;
export const CONTEST_JOIN = `${BASE_URL}/contest/join`;
export const CONTEST_LEAVE = `${BASE_URL}/contest/leave`;
export const CONTEST_CREATE = `${BASE_URL}/contest/create`;
export const CONTEST_ITEM_UPDATE = `${BASE_URL}/contest/item/update`;

export const LIST_MY = `${BASE_URL}/list/my`;
export const LIST_CREATE = `${BASE_URL}/list/create`;
export const LIST_DELETE = `${BASE_URL}/list/delete`;
export const LIST_UPDATE = `${BASE_URL}/list/update`;
export const LIST_ITEM_UPDATE = `${BASE_URL}/list/item/update`;
export const LIST_ITEM_DELETE = `${BASE_URL}/list/item/delete`;
export const LIST_ITEM_ADD = `${BASE_URL}/list/item/add`;

export const PROGRESS_RESET_LIST = `${BASE_URL}/progress_reset/list`;
export const PROGRESS_RESET_ADD = `${BASE_URL}/progress_reset/add`;
export const PROGRESS_RESET_DELETE = `${BASE_URL}/progress_reset/delete`;
