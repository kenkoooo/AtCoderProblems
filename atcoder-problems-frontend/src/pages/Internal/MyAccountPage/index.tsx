import React, { useEffect, useState } from "react";
import { connect, PromiseState, PropsMapInner } from "react-refetch";
import { Nav, NavItem, NavLink, Spinner } from "reactstrap";
import {
  Redirect,
  useRouteMatch,
  Switch,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { USER_GET, USER_UPDATE } from "../ApiUrl";
import { UserProblemListPage } from "../UserProblemListPage";
import { UserResponse } from "../types";
import { MyContestList } from "./MyContestList";
import { ResetProgress } from "./ResetProgress";
import { UserIdUpdate } from "./UserIdUpdate";

interface InnerProps {
  userInfoGet: PromiseState<UserResponse | null>;
  updateUserInfo: (atcoderUser: string) => void;
  updateUserInfoResponse: PromiseState<Record<string, unknown> | null>;
}

const InnerMyAccountPage = (props: InnerProps): JSX.Element => {
  const { userInfoGet, updateUserInfoResponse } = props;

  const [userId, setUserId] = useState("");
  const { path } = useRouteMatch();
  const { pathname } = useLocation();

  useEffect(() => {
    if (userInfoGet.fulfilled && userInfoGet.value) {
      setUserId(userInfoGet.value.atcoder_user_id ?? "");
    }
    // We only want to set the userId when the userInfoGet promise is first fulfilled.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfoGet.fulfilled]);

  if (userInfoGet.rejected || updateUserInfoResponse.rejected) {
    return <Redirect to="/" />;
  } else if (userInfoGet.pending) {
    return <Spinner style={{ width: "3rem", height: "3rem" }} />;
  } else {
    const updating = updateUserInfoResponse.refreshing;
    const updated =
      !updating &&
      updateUserInfoResponse.fulfilled &&
      updateUserInfoResponse.value !== null;

    return (
      <>
        <Nav tabs>
          <NavItem>
            <NavLink tag={Link} to={path} active={path === pathname}>
              Account Info
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              tag={Link}
              to={`${path}/contests`}
              active={`${path}/contests` === pathname}
            >
              My Contests
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              tag={Link}
              to={`${path}/my_lists`}
              active={`${path}/my_lists` === pathname}
            >
              My Lists
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              tag={Link}
              to={`${path}/reset`}
              active={`${path}/reset` === pathname}
            >
              Reset Progress
            </NavLink>
          </NavItem>
        </Nav>

        <Switch>
          <Route exact path={path}>
            <UserIdUpdate
              userId={userId}
              setUserId={setUserId}
              onSubmit={() => props.updateUserInfo(userId)}
              status={updating ? "updating" : updated ? "updated" : "open"}
            />
          </Route>
          <Route exact path={`${path}/contests`}>
            <MyContestList />
          </Route>
          <Route exact path={`${path}/my_lists`}>
            <UserProblemListPage />
          </Route>
          <Route exact path={`${path}/reset`}>
            <ResetProgress />
          </Route>
        </Switch>
      </>
    );
  }
};

export const MyAccountPage = connect<unknown, InnerProps>(() => ({
  userInfoGet: {
    url: USER_GET,
  },
  updateUserInfo: (
    atcoderUser: string
  ): PropsMapInner<Pick<InnerProps, "updateUserInfoResponse">> => ({
    updateUserInfoResponse: {
      force: true,
      refreshing: true,
      url: USER_UPDATE,
      method: "POST",
      body: JSON.stringify({ atcoder_user_id: atcoderUser }),
    },
  }),
  updateUserInfoResponse: {
    value: null,
  },
}))(InnerMyAccountPage);
