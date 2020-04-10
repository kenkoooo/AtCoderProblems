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

  return (
    <>
      <Nav tabs className="my-2">
        <NavItem>
          <NavLink tag={RouterLink} to={`/table/${userIdsPath}`}>
            Table
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink tag={RouterLink} to={`/list/${userIdsPath}`}>
            List
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            tag={RouterLink}
            to={`/user/${userIdsPath}`}
            disabled={userIdsPath.startsWith("/") || userIdsPath.length === 0}
          >
            UserPage
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink tag={RouterLink} to="/submissions/recent">
            Recent Submissions
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink tag={RouterLink} to="/contest/recent">
            Virtual Contests
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink tag={RouterLink} to="/training">
            Training (beta)
          </NavLink>
        </NavItem>
      </Nav>
      <div>{props.children}</div>
    </>
  );
};

export const TabFrame = connect<{}, Props>(() => ({
  loginState: USER_GET
}))(InnerTabFrame);
