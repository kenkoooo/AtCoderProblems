import React, { useEffect, useState } from "react";
import { connect, PromiseState, PropsMapInner } from "react-refetch";
import {
  Alert,
  Button,
  Col,
  Input,
  Label,
  Nav,
  NavItem,
  NavLink,
  Row,
  Spinner,
  TabContent,
  TabPane,
} from "reactstrap";
import { Redirect } from "react-router-dom";
import { USER_GET, USER_UPDATE } from "../ApiUrl";
import { UserProblemListPage } from "../UserProblemListPage";
import { UserResponse } from "../types";
import { MyContestList } from "./MyContestList";
import { ResetProgress } from "./ResetProgress";

type TabType =
  | "Account Info"
  | "My Contests"
  | "Problem Lists"
  | "Reset Progress";

interface InnerProps {
  userInfoGet: PromiseState<UserResponse | null>;
  updateUserInfo: (atcoderUser: string) => void;
  updateUserInfoResponse: PromiseState<{} | null>;
}

const InnerMyAccountPage = (props: InnerProps): JSX.Element => {
  const { userInfoGet, updateUserInfoResponse } = props;

  const [userId, setUserId] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("Account Info");

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
            <NavLink
              active={activeTab === "Account Info"}
              onClick={(): void => {
                setActiveTab("Account Info");
              }}
            >
              Account Info
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              active={activeTab === "My Contests"}
              onClick={(): void => {
                setActiveTab("My Contests");
              }}
            >
              My Contests
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              active={activeTab === "Problem Lists"}
              onClick={(): void => {
                setActiveTab("Problem Lists");
              }}
            >
              Problem Lists
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              active={activeTab === "Reset Progress"}
              onClick={(): void => {
                setActiveTab("Reset Progress");
              }}
            >
              Reset Progress
            </NavLink>
          </NavItem>
        </Nav>
        <TabContent activeTab={activeTab}>
          <TabPane tabId="Account Info">
            <form
              onSubmit={(event): void => {
                event.preventDefault();
                props.updateUserInfo(userId);
              }}
            >
              <Row className="my-2">
                <Col sm="12">
                  <h2>Account Info</h2>
                </Col>
              </Row>
              <Row className="my-2">
                <Col sm="12">
                  <Label>AtCoder User ID</Label>
                  <Input
                    type="text"
                    placeholder="AtCoder User ID"
                    value={userId}
                    pattern="[a-zA-Z0-9_]*"
                    onChange={(event): void => setUserId(event.target.value)}
                  />
                </Col>
              </Row>
              <Row className="my-2">
                <Col sm="12">
                  <Button disabled={updating} as="button" type="submit">
                    {updating ? "Updating..." : "Update"}
                  </Button>
                </Col>
              </Row>
              <Row className="my-2">
                <Col sm="12">
                  <Alert color="success" isOpen={updated}>
                    Updated
                  </Alert>
                </Col>
              </Row>
            </form>
          </TabPane>

          <TabPane tabId="My Contests">
            <MyContestList />
          </TabPane>
          <TabPane tabId="Problem Lists">
            <UserProblemListPage />
          </TabPane>
          <TabPane tabId="Reset Progress">
            <ResetProgress />
          </TabPane>
        </TabContent>
      </>
    );
  }
};

export const MyAccountPage = connect<{}, InnerProps>(() => ({
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
