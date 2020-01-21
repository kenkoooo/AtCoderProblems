import React, { useState } from "react";
import { NavLink as RouterLink, useHistory } from "react-router-dom";
import { withRouter, RouteComponentProps } from "react-router";
import {
  Collapse,
  Navbar,
  NavbarBrand,
  NavbarToggler,
  Nav,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Form,
  Input,
  Button,
  FormGroup,
  NavItem,
  NavLink
} from "reactstrap";
import { extractRivalsParam, normalizeUserId } from "../utils";
import { connect, PromiseState } from "react-refetch";
import { USER_GET } from "../pages/Internal/ApiUrl";
import { UserResponse } from "../pages/Internal/types";

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

interface OuterProps extends RouteComponentProps {}

interface InnerProps extends OuterProps {
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

const NavigationBar2 = (props: InnerProps) => {
  const { pathname } = props.location;
  const initialPageKind = extractPageKind(pathname);
  const initialState = extractUserIds(pathname);
  const loggedInUserId =
    props.loginState.fulfilled &&
    props.loginState.value &&
    props.loginState.value.atcoder_user_id
      ? props.loginState.value.atcoder_user_id
      : "";

  const initialUserId = initialPageKind ? initialState.userId : "";
  const initialRivalIdString = initialPageKind
    ? initialState.rivalIdString
    : "";

  const history = useHistory();
  const [pageKind, setPageKind] = useState<PageKind>(
    initialPageKind ?? "table"
  );
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState(initialUserId);
  const [rivalIdString, setRivalIdString] = useState(initialRivalIdString);

  const submit = (
    nextKind: PageKind,
    currentUserId: string,
    submitRivalIdString: string
  ) => {
    const submitUserId = currentUserId ? currentUserId : loggedInUserId;
    const path = generatePath(nextKind, submitUserId, submitRivalIdString);
    history.push({ pathname: path });
    setPageKind(nextKind);
  };

  return (
    <Navbar color="light" light expand="lg" fixed="top">
      <NavbarBrand>AtCoder Problems</NavbarBrand>
      <NavbarToggler onClick={() => setIsOpen(!isOpen)} />
      <Collapse isOpen={isOpen} navbar>
        <Nav className="ml-auto" navbar>
          <Form inline>
            <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
              <Input
                style={{ width: "120px" }}
                onKeyPress={e => {
                  if (e.key === "Enter" && pageKind !== null) {
                    submit(pageKind, userId, rivalIdString);
                  }
                }}
                value={userId}
                type="text"
                name="user_id"
                id="user_id"
                placeholder={loggedInUserId ? loggedInUserId : "User ID"}
                onChange={e => setUserId(e.target.value)}
              />
            </FormGroup>
            <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
              <Input
                style={{ width: "120px" }}
                onKeyPress={e => {
                  if (e.key === "Enter" && pageKind !== null) {
                    submit(pageKind, userId, rivalIdString);
                  }
                }}
                value={rivalIdString}
                type="text"
                name="rival_id"
                id="rival_id"
                placeholder="Rival ID, ..."
                onChange={e => setRivalIdString(e.target.value)}
              />
            </FormGroup>
            <Button
              className="mb-2 mr-sm-2 mb-sm-0"
              tag={RouterLink}
              to={generatePath(
                "table",
                userId ? userId : loggedInUserId,
                rivalIdString
              )}
              onClick={() => {
                submit("table", userId, rivalIdString);
              }}
            >
              Table
            </Button>
            <Button
              className="mb-2 mr-sm-2 mb-sm-0"
              tag={RouterLink}
              to={generatePath(
                "list",
                userId ? userId : loggedInUserId,
                rivalIdString
              )}
              onClick={() => {
                submit("list", userId, rivalIdString);
              }}
            >
              List
            </Button>
            <Button
              className="mb-2 mr-sm-2 mb-sm-0"
              disabled={userId.length === 0 && loggedInUserId.length === 0}
              tag={RouterLink}
              to={generatePath(
                "user",
                userId ? userId : loggedInUserId,
                rivalIdString
              )}
              onClick={() => {
                submit("user", userId, rivalIdString);
              }}
            >
              User Page
            </Button>
          </Form>
        </Nav>
        <Nav className="ml-auto" navbar>
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
            <NavLink tag={RouterLink} to="/contest/recent">
              Virtual Contests
            </NavLink>
          </NavItem>

          <NavItem>
            {loggedInUserId ? (
              <NavLink tag={RouterLink} to="/login/user">
                Account ({loggedInUserId})
              </NavLink>
            ) : (
              <NavLink href="https://github.com/login/oauth/authorize?client_id=162a5276634fc8b970f7">
                Login
              </NavLink>
            )}
          </NavItem>

          <UncontrolledDropdown nav inNavbar>
            <DropdownToggle nav caret>
              Links
            </DropdownToggle>
            <DropdownMenu right>
              <DropdownItem tag="a" href="https://atcoder.jp/" target="_blank">
                AtCoder
              </DropdownItem>
              <DropdownItem
                tag="a"
                href="http://aoj-icpc.ichyo.jp/"
                target="_blank"
              >
                AOJ-ICPC
              </DropdownItem>
              <DropdownItem
                tag="a"
                href="https://github.com/kenkoooo/AtCoderProblems"
                target="_blank"
              >
                GitHub
              </DropdownItem>
              <DropdownItem
                tag="a"
                href="https://twitter.com/kenkoooo"
                target="_blank"
              >
                @kenkoooo
              </DropdownItem>
            </DropdownMenu>
          </UncontrolledDropdown>
        </Nav>
      </Collapse>
    </Navbar>
  );
};
export default withRouter(
  connect<OuterProps, InnerProps>(() => ({
    loginState: {
      url: USER_GET
    }
  }))(NavigationBar2)
);
