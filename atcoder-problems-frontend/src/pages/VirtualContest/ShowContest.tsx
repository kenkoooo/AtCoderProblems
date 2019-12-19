import React from "react";
import { useParams } from "react-router-dom";
import { connect, PromiseState } from "react-refetch";
import { VirtualContest } from "./types";
import { Button, Row, Table } from "reactstrap";
import * as CachedApi from "../../utils/CachedApiClient";
import { Map } from "immutable";
import { ProblemId } from "../../interfaces/Status";
import Problem from "../../interfaces/Problem";
import * as CookieUtils from "../../utils/CookieUtils";

interface OuterProps {
  contestId: string | undefined;
}

interface InnerProps extends OuterProps {
  contestInfoFetch: PromiseState<VirtualContest>;
  joinContest: () => void;
  joinContestPost: PromiseState<{} | null>;
  problemMapFetch: PromiseState<Map<ProblemId, Problem>>;
}

const ShowContest = connect<OuterProps, InnerProps>(props => ({
  contestInfoFetch: {
    url: `http://localhost/atcoder-api/v3/internal/contest/get/${props.contestId}`
  },
  problemMapFetch: {
    comparison: null,
    value: () => CachedApi.cachedProblemMap()
  },
  joinContest: () => ({
    joinContestPost: {
      url: "http://localhost/atcoder-api/v3/internal/contest/join",
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ contest_id: props.contestId })
    }
  }),
  joinContestPost: { value: null }
}))(props => {
  const { contestInfoFetch } = props;
  if (contestInfoFetch.pending) {
    return <p>loading...</p>;
  } else if (contestInfoFetch.rejected) {
    return <p>connection error</p>;
  }
  const contestInfo = contestInfoFetch.value;
  const isLoggedIn = CookieUtils.isLoggedIn();

  return (
    <>
      <Row>
        <h1>{contestInfo.title}</h1>
        {isLoggedIn ? (
          <Button onClick={() => props.joinContest()}>Join</Button>
        ) : null}
      </Row>

      <Row>
        <Table>
          <thead>
            <tr>
              <th>Participants</th>
              {contestInfo.problems.map(problemId => (
                <th key={problemId}>{problemId}</th>
              ))}
            </tr>
          </thead>
        </Table>
      </Row>
    </>
  );
});

export default () => {
  const { contestId } = useParams();
  return <ShowContest contestId={contestId} />;
};
