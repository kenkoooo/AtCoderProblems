import React from "react";
import { RouteComponentProps } from "react-router-dom";

type Props = {} & RouteComponentProps<{
  loginId: string;
}>;

const InternalDashboardPage = (props: Props) => (
  <p>{props.match.params.loginId}</p>
);

export default InternalDashboardPage;
