import React, { useEffect, useMemo, useState } from "react";
import {
  NavLink as RouterLink,
  useLocation,
  useHistory
} from "react-router-dom";
import {
  Button,
  ButtonGroup,
  Collapse,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Form,
  Input,
  Nav,
  NavItem,
  NavLink,
  Navbar,
  NavbarBrand,
  NavbarToggler,
  UncontrolledDropdown
} from "reactstrap";
import { extractRivalsParam, normalizeUserId } from "../utils";
import { connect, PromiseState } from "react-refetch";
import { USER_GET } from "../pages/Internal/ApiUrl";
import { UserResponse } from "../pages/Internal/types";
import { GITHUB_LOGIN_LINK } from "../utils/Url";
import { ACCOUNT_INFO } from "../utils/RouterPath";

type PageKind = "table" | "list" | "user";

const extractPageKind = (pathname: string): PageKind | undefined => {
  if (pathname.match(/^\/user/)) {
    return "user";
  } else if (pathname.match(/^\/list/)) {
    return "list";
  } else if (pathname.match(/^\/table/)) {
    return "table";
  } else {
    return undefined;
  }
};

const extractUserIds = (pathname: string) => {
  const params = pathname.split("/");
  const userId = params.length >= 3 ? params[2] : "";
  const rivalIdString = params
    .slice(3)
    .filter(x => x.length > 0)
    .join(",");
  return { userId, rivalIdString };
};

interface InnerProps {
  loginState: PromiseState<UserResponse | null>;
}
const generatePath = (
  kind: PageKind,
  userId: string,
  rivalIdString: string
) => {
  const users = [normalizeUserId(userId), ...extractRivalsParam(rivalIdString)];
  return "/" + kind + "/" + users.join("/");
};

const InnerNavigationBar = (props: InnerProps) => {
  const { pathname } = useLocation();
  const pageKind = extractPageKind(pathname);

  const pathState = pageKind ? extractUserIds(pathname) : undefined;
  const pathUserId = pathState?.userId;
  const pathRivalIdString = pathState?.rivalIdString;

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

  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState(pathUserId ?? "");
  const [rivalIdString, setRivalIdString] = useState(pathRivalIdString ?? "");

  const history = useHistory();
  const pushHistory = () => {
    const p = generatePath(
      pageKind ?? "table",
      userId ? userId : loggedInUserId,
      rivalIdString
    );
    history.push({ pathname: p });
  };

  useEffect(() => {
    if (pathUserId) {
      setUserId(pathUserId);
    }
    if (pathRivalIdString) {
      setRivalIdString(pathRivalIdString);
    }
  }, [pathUserId, pathRivalIdString]);

  const [tablePath, listPath, userPath] = useMemo(
    () => [
      generatePath("table", userId ? userId : loggedInUserId, rivalIdString),
      generatePath("list", userId ? userId : loggedInUserId, rivalIdString),
      generatePath("user", userId ? userId : loggedInUserId, rivalIdString)
    ],
    [userId, loggedInUserId, rivalIdString]
  );

  return (
    <div className="sticky-top">
      <Navbar color="dark" dark expand="lg">
        <NavbarBrand tag={RouterLink} to="/" className="mb-0 h1">
          AtCoder Problems
        </NavbarBrand>

        <NavbarToggler onClick={() => setIsOpen(!isOpen)} />

        <Collapse isOpen={isOpen} navbar>
          <Nav navbar>
            <NavItem>
              <NavLink tag={RouterLink} to={tablePath}>
                Problems
              </NavLink>
            </NavItem>

            <UncontrolledDropdown nav inNavbar>
              <DropdownToggle nav caret>
                Rankings
              </DropdownToggle>
              <DropdownMenu right>
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

            <UncontrolledDropdown nav inNavbar>
              <DropdownToggle nav caret>
                Links
              </DropdownToggle>
              <DropdownMenu right>
                <DropdownItem
                  tag="a"
                  href="https://github.com/kenkoooo/AtCoderProblems/tree/master/doc"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  FAQ
                </DropdownItem>
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

      <Navbar color="light" light expand="lg" className="border-bottom">
        <Collapse isOpen={isOpen} navbar>
          <Nav navbar>
            <Form inline>
              <Input
                className="mt-2 mr-2 mt-lg-0"
                style={{ width: 160 }}
                onKeyPress={e => {
                  if (e.key === "Enter") {
                    pushHistory();
                  }
                }}
                value={userId}
                type="text"
                name="user_id"
                id="user_id"
                placeholder={loggedInUserId ? loggedInUserId : "User ID"}
                onChange={e => setUserId(e.target.value)}
              />

              <Input
                className="mt-2 mr-2 mt-lg-0"
                style={{ width: 160 }}
                onKeyPress={e => {
                  if (e.key === "Enter") {
                    pushHistory();
                  }
                }}
                value={rivalIdString}
                type="text"
                name="rival_id"
                id="rival_id"
                placeholder="Rival ID, ..."
                onChange={e => setRivalIdString(e.target.value)}
              />

              <ButtonGroup className="mt-2 mb-0 mt-lg-0">
                <Button tag={RouterLink} to={tablePath} color="light">
                  Table
                </Button>

                <Button tag={RouterLink} to={listPath} color="light">
                  List
                </Button>

                <Button
                  disabled={userId.length === 0 && loggedInUserId.length === 0}
                  tag={RouterLink}
                  to={userPath}
                  color="light"
                >
                  User
                </Button>
              </ButtonGroup>
            </Form>
          </Nav>
        </Collapse>
      </Navbar>
    </div>
  );
};

export const NavigationBar = connect<{}, InnerProps>(() => ({
  loginState: {
    url: USER_GET
  }
}))(InnerNavigationBar);
