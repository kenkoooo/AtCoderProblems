import { UserResponse } from "../pages/Internal/types";

export const isLoggedIn = (loginState: UserResponse | undefined): boolean =>
  !!loginState && loginState.internal_user_id.length > 0;

export const loggedInUserId = (
  loginState: UserResponse | undefined
): string | undefined =>
  loginState?.atcoder_user_id != null ? loginState?.atcoder_user_id : undefined;
