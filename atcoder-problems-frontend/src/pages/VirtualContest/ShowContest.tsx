import React from "react";
import { useParams } from "react-router-dom";
import { connect, PromiseState } from "react-refetch";
import { VirtualContest } from "./types";
import { Row } from "reactstrap";

interface OuterProps {
  contestId: string | undefined;
}
interface InnerProps extends OuterProps {
  contestInfoFetch: PromiseState<VirtualContest>;
}

const ShowContest = connect<OuterProps, InnerProps>(props => ({
  contestInfoFetch: {
    url: `http://localhost/atcoder-api/v3/internal/contest/get/${props.contestId}`
  }
}))(props => {
  const { contestInfoFetch } = props;
  if (contestInfoFetch.pending) {
    return <p>loading...</p>;
  } else if (contestInfoFetch.rejected) {
    return <p>connection error</p>;
  }
  const contestInfo = contestInfoFetch.value;
  return (
    <>
      <Row>
        <h1>{contestInfo.title}</h1>
      </Row>
    </>
  );
});

export default () => {
  const { contestId } = useParams();
  return <ShowContest contestId={contestId} />;
};
