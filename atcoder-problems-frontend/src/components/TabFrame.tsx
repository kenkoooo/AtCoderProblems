import React, { ReactNode } from "react";
import { Nav, NavItem, NavLink } from "reactstrap";
import { useParams, NavLink as RouterLink } from "react-router-dom";

interface Props {
  children?: ReactNode;
  loggedInUserId: string | undefined;
}

export const TabFrame = (props: Props) => {
  const { userIds } = useParams();
  const loggedInUserId = props?.loggedInUserId ?? "";

  const userIdsPath = userIds
    ? userIds.startsWith("/")
      ? loggedInUserId + userIds
      : userIds
    : "";

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
      </Nav>
      {props.children}
    </>
  );
};
