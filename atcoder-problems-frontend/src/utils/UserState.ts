import { PromiseState } from "react-refetch";
import { UserResponse } from "../pages/Internal/types";

export const isLoggedIn = (loginState: PromiseState<UserResponse | null>) =>
  loginState.fulfilled &&
  loginState.value !== null &&
  loginState.value.internal_user_id.length > 0;

export const loggedInUserId = <V>(
  loginState: PromiseState<UserResponse | null>,
  failedVal: V
): string | V =>
  loginState.fulfilled &&
  loginState.value !== null &&
  loginState.value.atcoder_user_id
    ? loginState.value.atcoder_user_id
    : failedVal;
