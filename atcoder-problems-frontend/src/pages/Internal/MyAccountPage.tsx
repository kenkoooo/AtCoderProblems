import React, { useState } from "react";
import { connect, PromiseState } from "react-refetch";
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
  TabContent,
  TabPane
} from "reactstrap";
import { Redirect, useHistory } from "react-router-dom";
import { VirtualContest } from "./VirtualContest/types";
import VirtualContestTable from "./VirtualContestTable";
import { CONTEST_JOINED, CONTEST_MY, USER_GET, USER_UPDATE } from "./ApiUrl";

type TabType = "Account Info" | "My Contests" | "Problem Lists";

interface UserResponse {
  internal_user_id: number;
  atcoder_user_id: string | null;
}

interface InnerProps {
  userInfoGet: PromiseState<UserResponse | null>;
  updateUserInfo: (atcoderUser: string) => void;
  updateUserInfoResponse: PromiseState<{} | null>;
  ownedContestsGet: PromiseState<VirtualContest[] | null>;
  joinedContestsGet: PromiseState<VirtualContest[] | null>;
}

export default connect<{}, InnerProps>(() => ({
  userInfoGet: {
    url: USER_GET
  },
  updateUserInfo: (atcoderUser: string) => ({
    updateUserInfoResponse: {
      force: true,
      refreshing: true,
      url: USER_UPDATE,
      method: "POST",
      body: JSON.stringify({ atcoder_user_id: atcoderUser })
    }
  }),
  updateUserInfoResponse: {
    value: null
  },
  ownedContestsGet: {
    url: CONTEST_MY
  },
  joinedContestsGet: {
    url: CONTEST_JOINED
  }
}))(props => {
  const {
    userInfoGet,
    updateUserInfoResponse,
    ownedContestsGet,
    joinedContestsGet
  } = props;
  const history = useHistory();
  if (userInfoGet.rejected || updateUserInfoResponse.rejected) {
    return <Redirect to="/" />;
  } else if (userInfoGet.pending) {
    return <p>loading ...</p>;
  } else {
    const userInfo = userInfoGet.value;
    const [userId, setUserId] = useState(
      userInfo && userInfo.atcoder_user_id ? userInfo.atcoder_user_id : ""
    );
    const [activeTab, setActiveTab] = useState<TabType>("Account Info");

    const updating = updateUserInfoResponse.refreshing;
    const updated =
      !updating &&
      updateUserInfoResponse.fulfilled &&
      updateUserInfoResponse.value !== null;
    const joinedContests = joinedContestsGet.fulfilled
      ? joinedContestsGet.value
      : [];
    const ownedContests = ownedContestsGet.fulfilled
      ? ownedContestsGet.value
      : [];

    return (
      <>
        <Nav tabs>
          <NavItem>
            <NavLink
              active={activeTab === "Account Info"}
              onClick={() => {
                setActiveTab("Account Info");
              }}
            >
              Account Info
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              active={activeTab === "My Contests"}
              onClick={() => {
                setActiveTab("My Contests");
              }}
            >
              My Contests
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              active={activeTab === "Problem Lists"}
              onClick={() => {
                setActiveTab("Problem Lists");
              }}
            >
              Problem Lists
            </NavLink>
          </NavItem>
        </Nav>
        <TabContent activeTab={activeTab}>
          <TabPane tabId="Account Info">
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
                  onChange={event => setUserId(event.target.value)}
                />
              </Col>
            </Row>
            <Row className="my-2">
              <Col sm="12">
                <Button
                  disabled={updating}
                  onClick={() => props.updateUserInfo(userId)}
                >
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
          </TabPane>

          <TabPane tabId="My Contests">
            <Row className="my-2">
              <Col sm="12">
                <Button
                  onClick={() => {
                    history.push({ pathname: "/contest/create" });
                  }}
                >
                  Create New Contest
                </Button>
              </Col>
            </Row>
            <Row className="my-2">
              <Col sm="12">
                <h2>My Contests</h2>
              </Col>
            </Row>
            <Row className="my-2">
              <Col sm="12">
                <VirtualContestTable
                  contests={ownedContests ? ownedContests : []}
                />
              </Col>
            </Row>

            <Row className="my-2">
              <Col sm="12">
                <h2>Joined Contests</h2>
              </Col>
            </Row>
            <Row className="my-2">
              <Col sm="12">
                <VirtualContestTable
                  contests={joinedContests ? joinedContests : []}
                />
              </Col>
            </Row>
          </TabPane>
          <TabPane tabId="Problem Lists">b</TabPane>
        </TabContent>
      </>
    );
  }
});
