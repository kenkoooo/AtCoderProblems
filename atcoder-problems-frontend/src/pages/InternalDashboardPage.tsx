import React from "react";
import { useParams } from "react-router-dom";

interface Props {
  setLoginId: (loginId: string | undefined) => void;
}

const InternalDashboardPage = (props: Props) => {
  const { loginId } = useParams();
  props.setLoginId(loginId);
  return <p>{loginId}</p>;
};

export default InternalDashboardPage;
