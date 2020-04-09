import React, { ReactNode } from "react";
import { Nav, NavItem, NavLink } from "reactstrap";
import { useParams, NavLink as RouterLink } from "react-router-dom";

interface Props {
  children?: ReactNode;
}

export const TabFrame = (props: Props) => {
  const { userIds } = useParams();
  return (
    <>
      <Nav tabs className="my-2">
        <NavItem>
          <NavLink tag={RouterLink} to={`/table/${userIds ?? ""}`}>
            Table
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink tag={RouterLink} to={`/list/${userIds ?? ""}`}>
            List
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            tag={RouterLink}
            to={`/user/${userIds ?? ""}`}
            disabled={!userIds || userIds.startsWith("/")}
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
