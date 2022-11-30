import React, { useEffect, useState } from "react";
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
import { UserProblemListPage } from "../UserProblemListPage";
import { MyContestList } from "./MyContestList";
import { ResetProgress } from "./ResetProgress";
import { UserIdUpdate } from "./UserIdUpdate";
import { updateUserInfo } from "./ApiClient";

export const MyAccountPage = (): JSX.Element => {
  const loginState = useLoginState();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isValidResponse, setIsValidResponse] = useState<boolean>();

  const [userId, setUserId] = useState("");
  const { path } = useRouteMatch();
  const { pathname } = useLocation();
  console.log(isUpdating);
  console.log(isValidResponse);

  const handleSubmit = async (userId: string) => {
    setIsUpdating(true);

    await updateUserInfo(userId).then((response) => {
      setIsValidResponse(response.status === 200);
    });

    setIsUpdating(false);
  };

  useEffect(() => {
    if (loginState.data) {
      setUserId(loginState.data.atcoder_user_id ?? "");
    }
    // We only want to set the userId when the userInfoGet promise is first fulfilled.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!loginState.data]);

  if (loginState.error || isValidResponse === false) {
    return <Redirect to="/" />;
  } else if (!loginState.data) {
    return <Spinner style={{ width: "3rem", height: "3rem" }} />;
  } else {
    const updated = !isUpdating && isValidResponse;

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
              onSubmit={async () => handleSubmit(userId)}
              status={isUpdating ? "updating" : updated ? "updated" : "open"}
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
