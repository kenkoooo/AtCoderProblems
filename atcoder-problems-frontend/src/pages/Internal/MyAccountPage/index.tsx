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
import { useLoginState } from "../../../api/InternalAPIClient";
import { USER_UPDATE } from "../ApiUrl";
import { UserProblemListPage } from "../UserProblemListPage";
import { MyContestList } from "./MyContestList";
import { ResetProgress } from "./ResetProgress";
import { UserIdUpdate } from "./UserIdUpdate";

interface InnerProps {
  updateUserInfo: (atcoderUser: string) => void;
  updateUserInfoResponse: PromiseState<Record<string, unknown> | null>;
}

const InnerMyAccountPage = (props: InnerProps): JSX.Element => {
  const { updateUserInfoResponse } = props;
  const loginState = useLoginState();

  const [userId, setUserId] = useState("");
  const { path } = useRouteMatch();
  const { pathname } = useLocation();

  useEffect(() => {
    if (loginState.data) {
      setUserId(loginState.data.atcoder_user_id ?? "");
    }
    // We only want to set the userId when the userInfoGet promise is first fulfilled.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!loginState.data]);

  if (loginState.error || updateUserInfoResponse.rejected) {
    return <Redirect to="/" />;
  } else if (!loginState.data) {
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
