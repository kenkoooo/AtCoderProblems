import React, { useState } from "react";
import { connect, PromiseState } from "react-refetch";
import * as CookieUtils from "../../utils/CookieUtils";
import { Alert, Button, Input, Label, Row } from "reactstrap";
import { Redirect } from "react-router-dom";

interface UserResponse {
  internal_user_id: number;
  atcoder_user_id: string | null;
}

interface InnerProps {
  userInfoGet: PromiseState<UserResponse>;
  updateUserInfo: (atcoderUser: string) => void;
  updateUserInfoResponse: PromiseState<{} | null>;
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
  }
}))(props => {
  const { userInfoGet, updateUserInfoResponse } = props;
  if (props.userInfoGet.rejected) {
    CookieUtils.clear();
    return <Redirect to="/" />;
  } else if (props.userInfoGet.pending) {
    return <p>loading ...</p>;
  } else {
    const userInfo = props.userInfoGet.value;
    const [userId, setUserId] = useState(
      userInfo.atcoder_user_id ? userInfo.atcoder_user_id : ""
    );

    const updating = updateUserInfoResponse.refreshing;
    const updated =
      !updating &&
      updateUserInfoResponse.fulfilled &&
      updateUserInfoResponse.value !== null;

    return (
      <>
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
      </>
    );
  }
});
