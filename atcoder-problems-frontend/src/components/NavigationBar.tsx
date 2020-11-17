import React from "react";
import { NavLink as RouterLink, Route } from "react-router-dom";
import {
  Collapse,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Nav,
  NavItem,
  NavLink,
  Navbar,
  NavbarBrand,
  NavbarToggler,
  UncontrolledDropdown,
} from "reactstrap";
import { connect, PromiseState } from "react-refetch";
import { USER_GET } from "../pages/Internal/ApiUrl";
import { UserResponse } from "../pages/Internal/types";
import { GITHUB_LOGIN_LINK } from "../utils/Url";
import { ACCOUNT_INFO } from "../utils/RouterPath";
import { UserSearchBar } from "./UserSearchBar";
import { ThemeSelector } from "./ThemeSelector";

interface InnerProps {
  loginState: PromiseState<UserResponse | null>;
}

const InnerNavigationBar: React.FC<InnerProps> = (props) => {
  const isLoggedIn =
    props.loginState.fulfilled &&
    props.loginState.value &&
    props.loginState.value.internal_user_id.length > 0;
  const loggedInUserId =
    props.loginState.fulfilled &&
    props.loginState.value &&
    props.loginState.value.atcoder_user_id
      ? props.loginState.value.atcoder_user_id
      : "";

  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Navbar color="dark" dark expand="lg">
        <NavbarBrand tag={RouterLink} to="/" className="mb-0 h1">
          AtCoder Problems
        </NavbarBrand>

        <NavbarToggler onClick={(): void => setIsOpen(!isOpen)} />

        <Collapse isOpen={isOpen} navbar>
          <Nav navbar>
            <NavItem>
              <NavLink tag={RouterLink} to="/table/">
                Problems
              </NavLink>
            </NavItem>

            <UncontrolledDropdown nav inNavbar>
              <DropdownToggle nav caret>
                Rankings
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem tag={RouterLink} to="/ac">
                  AC Count
                </DropdownItem>
                <DropdownItem tag={RouterLink} to="/fast">
                  Fastest Submissions
                </DropdownItem>
                <DropdownItem tag={RouterLink} to="/short">
                  Shortest Submissions
                </DropdownItem>
                <DropdownItem tag={RouterLink} to="/first">
                  First AC
                </DropdownItem>
                <DropdownItem tag={RouterLink} to="/sum">
                  Rated Point Ranking
                </DropdownItem>
                <DropdownItem tag={RouterLink} to="/streak">
                  Streak Ranking
                </DropdownItem>
                <DropdownItem tag={RouterLink} to="/lang">
                  Language Owners
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>

            <NavItem>
              <NavLink tag={RouterLink} to="/submissions/recent">
                Submissions
              </NavLink>
            </NavItem>

            <NavItem>
              <NavLink
                href="https://github.com/kenkoooo/AtCoderProblems/tree/master/doc"
                target="_blank"
                rel="noopener noreferrer"
              >
                FAQ
              </NavLink>
            </NavItem>

            <UncontrolledDropdown nav inNavbar>
              <DropdownToggle nav caret>
                Links
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem
                  tag="a"
                  href="https://atcoder.jp/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  AtCoder
                </DropdownItem>
                <DropdownItem
                  tag="a"
                  href="http://aoj-icpc.ichyo.jp/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  AOJ-ICPC
                </DropdownItem>
                <DropdownItem
                  tag="a"
                  href="https://github.com/kenkoooo/AtCoderProblems"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </DropdownItem>
                <DropdownItem
                  tag="a"
                  href="https://twitter.com/kenkoooo"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @kenkoooo
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
          </Nav>

          <Nav className="ml-auto" navbar>
            <ThemeSelector />

            <NavItem>
              <NavLink tag={RouterLink} to="/contest/recent">
                Virtual Contests
              </NavLink>
            </NavItem>

            <NavItem>
              <NavLink tag={RouterLink} to="/training">
                Training
              </NavLink>
            </NavItem>

            <NavItem>
              {isLoggedIn ? (
                <NavLink tag={RouterLink} to={ACCOUNT_INFO}>
                  Account ({loggedInUserId})
                </NavLink>
              ) : (
                <NavLink href={GITHUB_LOGIN_LINK}>Login</NavLink>
              )}
            </NavItem>
          </Nav>
        </Collapse>
      </Navbar>

      <Route
        path={[
          "/user/:userIds([a-zA-Z0-9_]+)+",
          "/table/:userIds([a-zA-Z0-9_]*)*",
          "/list/:userIds([a-zA-Z0-9_]*)*",
        ]}
      >
        <UserSearchBar isOpen={isOpen} />
      </Route>
    </>
  );
};

export const NavigationBar = connect<unknown, InnerProps>(() => ({
  loginState: {
    url: USER_GET,
  },
}))(InnerNavigationBar);
