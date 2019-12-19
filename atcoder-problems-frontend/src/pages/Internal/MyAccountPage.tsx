import React, { useState } from "react";
import { connect, PromiseState } from "react-refetch";
import * as CookieUtils from "../../utils/CookieUtils";
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

type TabType = "Account Info" | "Virtual Contests" | "Problem Lists";

interface UserResponse {
  internal_user_id: number;
  atcoder_user_id: string | null;
}

interface InnerProps {
  userInfoGet: PromiseState<UserResponse>;
  updateUserInfo: (atcoderUser: string) => void;
  updateUserInfoResponse: PromiseState<{} | null>;
  ownedContestsGet: PromiseState<VirtualContest[]>;
  joinedContestsGet: PromiseState<VirtualContest[]>;
}

export default connect<{}, InnerProps>(() => ({
  userInfoGet: {
    url: "http://localhost/internal-api/user/get"
  },
  updateUserInfo: (atcoderUser: string) => ({
    updateUserInfoResponse: {
      force: true,
      refreshing: true,
      url: "http://localhost/internal-api/user/update",
      method: "POST",
      body: JSON.stringify({ atcoder_user_id: atcoderUser })
    }
  }),
  updateUserInfoResponse: {
    value: null
  },
  ownedContestsGet: {
    url: "http://localhost/internal-api/contest/my"
  },
  joinedContestsGet: {
    url: "http://localhost/internal-api/contest/joined"
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
    CookieUtils.clear();
    return <Redirect to="/" />;
  } else if (userInfoGet.pending) {
    return <p>loading ...</p>;
  } else {
    const userInfo = userInfoGet.value;
    const [userId, setUserId] = useState(
      userInfo.atcoder_user_id ? userInfo.atcoder_user_id : ""
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
              active={activeTab === "Virtual Contests"}
              onClick={() => {
                setActiveTab("Virtual Contests");
              }}
            >
              Virtual Contests
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
            <Row my="2">
              <Col sm="12">
                <h2>Account Info</h2>
              </Col>
            </Row>
            <Row my="2">
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
            <Row my="2">
              <Col sm="12">
                <Button
                  disabled={updating}
                  onClick={() => props.updateUserInfo(userId)}
                >
                  {updating ? "Updating..." : "Update"}
                </Button>
              </Col>
            </Row>
            <Row my="2">
              <Col sm="12">
                <Alert color="success" isOpen={updated}>
                  Updated
                </Alert>
              </Col>
            </Row>
          </TabPane>

          <TabPane tabId="Virtual Contests">
            <Row my="2">
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
            <Row my="2">
              <Col sm="12">
                <h2>My Contests</h2>
              </Col>
            </Row>
            <Row my="2">
              <Col sm="12">
                <VirtualContestTable contests={ownedContests} />
              </Col>
            </Row>

            <Row my="2">
              <Col sm="12">
                <h2>Joined Contests</h2>
              </Col>
            </Row>
            <Row my="2">
              <Col sm="12">
                <VirtualContestTable contests={joinedContests} />
              </Col>
            </Row>
          </TabPane>
          <TabPane tabId="Problem Lists">b</TabPane>
        </TabContent>
      </>
    );
  }
});
