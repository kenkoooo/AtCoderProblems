import { isUserInfo } from "../interfaces/UserInfo";

const BASE_URL = "https://kenkoooo.com/atcoder";
const DYNAMIC_API_BASE_URL = BASE_URL + "/atcoder-api";

export const fetchUserInfo = (user: string) =>
  user.length > 0
    ? fetch(`${DYNAMIC_API_BASE_URL}/v2/user_info?user=${user}`)
        .then(r => r.json())
        .then(r => {
          if (isUserInfo(r)) {
            return r;
          } else {
            // tslint:disable-next-line
            console.error("Invalid UserInfo: ", r);
          }
        })
        .catch(() => undefined)
    : Promise.resolve(undefined);
