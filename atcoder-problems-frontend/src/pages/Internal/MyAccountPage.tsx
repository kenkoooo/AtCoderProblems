import React, { useState } from "react";
import { connect, PromiseState } from "react-refetch";
import * as CookieUtils from "../../utils/CookieUtils";
import { Alert, Button, Input, Label, Row } from "reactstrap";
import { Redirect } from "react-router-dom";
import { VirtualContest } from "./VirtualContest/types";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";

const VirtualContestTable = (props: { contests: VirtualContest[] }) => {
  return (
    <BootstrapTable
      data={props.contests}
      pagination
      keyField="id"
      height="auto"
      hover
      striped
      search
    >
      <TableHeaderColumn dataField="title">Title</TableHeaderColumn>
      <TableHeaderColumn dataField="memo">Description</TableHeaderColumn>
      <TableHeaderColumn dataField="start_epoch_second">
        Start
      </TableHeaderColumn>
      <TableHeaderColumn dataField="duration_second">End</TableHeaderColumn>
    </BootstrapTable>
  );
};

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
        <Row className="my-2">
          <h2>Account Info</h2>
        </Row>
        <Row className="my-2">
          <Label>AtCoder User Id</Label>
          <Input
            type="text"
            placeholder="Contest Title"
            value={userId}
            onChange={event => setUserId(event.target.value)}
          />
        </Row>
        <Row className="my-2">
          <Button
            disabled={updating}
            onClick={() => props.updateUserInfo(userId)}
          >
            {updating ? "Updating..." : "Update"}
          </Button>
        </Row>
        <Row className="my-2">
          <Alert color="success" isOpen={updated}>
            Updated
          </Alert>
        </Row>

        <Row className="my-2">
          <h2>My Contests</h2>
        </Row>
        <Row>
          <VirtualContestTable contests={ownedContests} />
        </Row>

        <Row className="my-2">
          <h2>Joined Contests</h2>
        </Row>
        <Row>
          <VirtualContestTable contests={joinedContests} />
        </Row>
      </>
    );
  }
});
