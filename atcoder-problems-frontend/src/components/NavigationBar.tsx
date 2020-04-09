import React, { useState } from "react";
import {
  NavLink as RouterLink,
  useLocation,
  useHistory
} from "react-router-dom";
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
import { GITHUB_LOGIN_LINK } from "../utils/Url";

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

  const initialState = pageKind ? extractUserIds(pathname) : undefined;
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
  const [userId, setUserId] = useState(initialState?.userId ?? "");
  const [rivalIdString, setRivalIdString] = useState(
    initialState?.rivalIdString ?? ""
  );

  const history = useHistory();
  const pushHistory = () => {
    const p = generatePath(
      pageKind ?? "table",
      userId ? userId : loggedInUserId,
      rivalIdString
    );
    history.push({ pathname: p });
  };

  return (
    <Navbar color="light" light expand="lg" fixed="top">
      <NavbarBrand tag={RouterLink} to="/">
        AtCoder Problems
      </NavbarBrand>
      <NavbarToggler onClick={() => setIsOpen(!isOpen)} />
      <Collapse isOpen={isOpen} navbar>
        <Nav className="ml-auto" navbar>
          <Form inline>
            <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
              <Input
                style={{ width: "120px" }}
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
            </FormGroup>
            <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
              <Input
                style={{ width: "120px" }}
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
            </FormGroup>
            <Button
              className="mb-2 mr-sm-2 mb-sm-0"
              tag={RouterLink}
              to={generatePath(
                "table",
                userId ? userId : loggedInUserId,
                rivalIdString
              )}
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
            {isLoggedIn ? (
              <NavLink tag={RouterLink} to="/login/user">
                Account ({loggedInUserId})
              </NavLink>
            ) : (
              <NavLink href={GITHUB_LOGIN_LINK}>Login</NavLink>
            )}
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
      </Collapse>
    </Navbar>
  );
};

export const NavigationBar = connect<{}, InnerProps>(() => ({
  loginState: {
    url: USER_GET
  }
}))(InnerNavigationBar);
