import { UserResponse } from "../Internal/types";
import React from "react";
import { Alert, Badge } from "reactstrap";
import { Link } from "react-router-dom";
import { ACCOUNT_INFO } from "../../utils/RouterPath";
import { GITHUB_LOGIN_LINK } from "../../utils/Url";

interface Props {
  user: UserResponse | undefined;
  loading: boolean;
}
export const LoginAdvice = (props: Props) => {
  if (props.loading) {
    return <Alert color="primary">Loading user info...</Alert>;
  }
  if (!props.user) {
    return (
      <Alert color="danger">
        <a href={GITHUB_LOGIN_LINK}>Login</a> to record your progress.
      </Alert>
    );
  }
  if (!props.user.atcoder_user_id) {
    return (
      <Alert color="warning">
        <Link to={ACCOUNT_INFO}>Set your AtCoder ID.</Link>
      </Alert>
    );
  }

  return (
    <Alert color="success">Training as {props.user.atcoder_user_id}</Alert>
  );
};
