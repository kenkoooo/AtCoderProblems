import React, { FC } from "react";
import { Nav, NavItem, NavLink } from "reactstrap";
import { useParams, NavLink as RouterLink } from "react-router-dom";
import { UserResponse } from "../pages/Internal/types";
import { connect, PromiseState } from "react-refetch";
import { USER_GET } from "../pages/Internal/ApiUrl";

interface Props {
  loginState: PromiseState<UserResponse | null>;
}

const InnerTabFrame: FC<Props> = props => {
  const { userIds } = useParams();
  const loggedInUserId =
    props.loginState.fulfilled &&
    props.loginState.value &&
    props.loginState.value.atcoder_user_id
      ? props.loginState.value.atcoder_user_id
      : "";

  const userIdsPath = userIds
    ? userIds.startsWith("/") || userIds === ""
      ? loggedInUserId + userIds
      : userIds
    : loggedInUserId;

  // WIP (rdrgn): fix the style or remove
  return (
    <>
      {userIds !== undefined && <h2>{userIds}</h2>}
      <div>{props.children}</div>
    </>
  );
};

export const TabFrame = connect<{}, Props>(() => ({
  loginState: USER_GET
}))(InnerTabFrame);
