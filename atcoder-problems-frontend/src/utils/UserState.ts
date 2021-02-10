import { PromiseState } from "react-refetch";
import { UserResponse } from "../pages/Internal/types";

export const isLoggedIn = (
  loginState: PromiseState<UserResponse | null>
): boolean =>
  loginState.fulfilled &&
  loginState.value !== null &&
  loginState.value.internal_user_id.length > 0;

export const loggedInUserId = (
  loginState: PromiseState<UserResponse | null>
): string | undefined =>
  loginState.fulfilled && loginState.value?.atcoder_user_id
    ? loginState.value.atcoder_user_id
    : undefined;
