import React from "react";
import { useParams } from "react-router-dom";
import { connect, PromiseState } from "react-refetch";
import { VirtualContest } from "./types";
import { Button, Row, Table, Col } from "reactstrap";
import * as CachedApi from "../../../utils/CachedApiClient";
import { Map } from "immutable";
import { ProblemId } from "../../../interfaces/Status";
import Problem from "../../../interfaces/Problem";
import * as CookieUtils from "../../../utils/CookieUtils";

interface UserInfo {
  atcoder_user_id: string;
}

interface OuterProps {
  contestId: string | undefined;
}

interface InnerProps extends OuterProps {
  contestInfoFetch: PromiseState<VirtualContest>;
  userInfoGet: PromiseState<UserInfo>;
  joinContest: () => void;
  joinContestPost: PromiseState<{} | null>;
  problemMapFetch: PromiseState<Map<ProblemId, Problem>>;
}

const ShowContest = connect<OuterProps, InnerProps>(props => ({
  userInfoGet: {
    url: "http://localhost/internal-api/user/get"
  },
  contestInfoFetch: {
    url: `http://localhost/internal-api/contest/get/${props.contestId}`
  },
  problemMapFetch: {
    comparison: null,
    value: () => CachedApi.cachedProblemMap()
  },
  joinContest: () => ({
    joinContestPost: {
      url: "http://localhost/internal-api/contest/join",
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ contest_id: props.contestId }),
      andThen: () => ({
        contestInfoFetch: {
          url: `http://localhost/internal-api/contest/get/${props.contestId}`,
          force: true,
          refreshing: true
        }
      })
    }
  }),
  joinContestPost: { value: null }
}))(props => {
  const { contestInfoFetch, userInfoGet } = props;
  if (userInfoGet.rejected) {
    CookieUtils.clear();
  }

  if (contestInfoFetch.pending) {
    return <p>loading...</p>;
  } else if (contestInfoFetch.rejected) {
    return <p>connection error</p>;
  }

  const contestInfo = contestInfoFetch.value;
  const atcoderUserId = userInfoGet.fulfilled
    ? userInfoGet.value.atcoder_user_id
    : null;
  const alreadyJoined =
    atcoderUserId != null && contestInfo.participants.includes(atcoderUserId);

  return (
    <>
      <Row>
        <Col sm="12">
          <h1>{contestInfo.title}</h1>
          {!alreadyJoined && atcoderUserId != null ? (
            <Button onClick={() => props.joinContest()}>Join</Button>
          ) : null}
        </Col>
      </Row>

      <Row>
        <Col sm="12">
          <Table>
            <thead>
              <tr>
                <th>Participants</th>
                {contestInfo.problems.map(problemId => (
                  <th key={problemId}>{problemId}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contestInfo.participants.map(userId => {
                return (
                  <tr>
                    <th>{userId}</th>
                    {contestInfo.problems.map(problemId => (
                      <td>
                        {userId} {problemId}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Col>
      </Row>
    </>
  );
});

export default () => {
  const { contestId } = useParams();
  return <ShowContest contestId={contestId} />;
};
