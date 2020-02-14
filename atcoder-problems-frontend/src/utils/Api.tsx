import { isUserInfo } from "../interfaces/UserInfo";

const ATCODER_API_URL = process.env.REACT_APP_ATCODER_API_URL;

export const fetchUserInfo = (user: string) =>
  user.length > 0
    ? fetch(`${ATCODER_API_URL}/v2/user_info?user=${user}`)
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
