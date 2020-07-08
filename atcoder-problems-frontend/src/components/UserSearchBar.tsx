import React from "react";
import {
  NavLink as RouterLink,
  useLocation,
  useHistory,
} from "react-router-dom";
import {
  Button,
  ButtonGroup,
  Form,
  Input,
  Nav,
  Navbar,
  Collapse,
} from "reactstrap";
import { connect, PromiseState } from "react-refetch";
import { extractRivalsParam, normalizeUserId } from "../utils";
import { USER_GET } from "../pages/Internal/ApiUrl";
import { UserResponse } from "../pages/Internal/types";

type PageKind = "table" | "list" | "user";

const extractPageKind = (pathname: string): PageKind | undefined => {
  if (/^\/user/.exec(pathname)) {
    return "user";
  } else if (/^\/list/.exec(pathname)) {
    return "list";
  } else if (/^\/table/.exec(pathname)) {
    return "table";
  } else {
    return undefined;
  }
};

const extractUserIds = (
  pathname: string
): { userId: string; rivalIdString: string } => {
  const params = pathname.split("/");
  const userId = params.length >= 3 ? params[2] : "";
  const rivalIdString = params
    .slice(3)
    .filter((x) => x.length > 0)
    .join(",");
  return { userId, rivalIdString };
};

interface OuterProps {
  isOpen: boolean;
}

interface InnerProps extends OuterProps {
  loginState: PromiseState<UserResponse | null>;
}

const generatePath = (
  kind: PageKind,
  userId: string,
  rivalIdString: string
): string => {
  const users = [normalizeUserId(userId), ...extractRivalsParam(rivalIdString)];
  return "/" + kind + "/" + users.join("/");
};

const InnerUserSearchBar: React.FC<InnerProps> = (props) => {
  const { pathname } = useLocation();
  const pageKind = extractPageKind(pathname);

  const pathState = pageKind ? extractUserIds(pathname) : undefined;
  const pathUserId = pathState?.userId;
  const pathRivalIdString = pathState?.rivalIdString;

  const loggedInUserId =
    props.loginState.fulfilled &&
    props.loginState.value &&
    props.loginState.value.atcoder_user_id
      ? props.loginState.value.atcoder_user_id
      : "";

  const [userId, setUserId] = React.useState(pathUserId ?? "");
  const [rivalIdString, setRivalIdString] = React.useState(
    pathRivalIdString ?? ""
  );

  const history = useHistory();
  const pushHistory = (): void => {
    const p = generatePath(
      pageKind ?? "table",
      userId ? userId : loggedInUserId,
      rivalIdString
    );
    history.push({ pathname: p });
  };

  React.useEffect(() => {
    if (pathUserId) {
      setUserId(pathUserId);
    }
    if (pathRivalIdString) {
      setRivalIdString(pathRivalIdString);
    }
  }, [pathUserId, pathRivalIdString]);

  const [tablePath, listPath, userPath] = React.useMemo(
    () => [
      generatePath("table", userId ? userId : loggedInUserId, rivalIdString),
      generatePath("list", userId ? userId : loggedInUserId, rivalIdString),
      generatePath("user", userId ? userId : loggedInUserId, rivalIdString),
    ],
    [userId, loggedInUserId, rivalIdString]
  );

  return (
    <Navbar
      color="light"
      light
      expand="md"
      className="border-bottom"
      style={{ padding: 0 }}
    >
      <Collapse isOpen={props.isOpen} navbar>
        <Nav navbar style={{ padding: "0.5rem 1rem" }}>
          <Form inline>
            <Input
              className="mt-2 mr-2 mt-lg-0 mt-md-0"
              style={{ width: 160 }}
              onKeyPress={(e): void => {
                if (e.key === "Enter") {
                  pushHistory();
                }
              }}
              value={userId}
              type="text"
              name="user_id"
              id="user_id"
              placeholder={loggedInUserId ? loggedInUserId : "User ID"}
              onChange={(e): void => setUserId(e.target.value)}
            />

            <Input
              className="mt-2 mr-2 mt-lg-0 mt-md-0"
              style={{ width: 160 }}
              onKeyPress={(e): void => {
                if (e.key === "Enter") {
                  pushHistory();
                }
              }}
              value={rivalIdString}
              type="text"
              name="rival_id"
              id="rival_id"
              placeholder="Rival ID, ..."
              onChange={(e): void => setRivalIdString(e.target.value)}
            />

            <ButtonGroup className="mt-2 mb-0 mt-lg-0 mt-md-0">
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
  );
};

export const UserSearchBar = connect<OuterProps, InnerProps>(() => ({
  loginState: {
    url: USER_GET,
  },
}))(InnerUserSearchBar);
