import { UserResponse } from "../pages/Internal/types";
import { useSWRData } from "./index";

const BASE_URL = process.env.REACT_APP_INTERNAL_API_URL;
export const USER_GET = `${BASE_URL}/user/get`;
export const useLoginState = () => {
  const fetcher = (url: string) =>
    fetch(url)
      .then((response) => response.json())
      .then((response) => response as UserResponse);
  return useSWRData(USER_GET, fetcher);
};
