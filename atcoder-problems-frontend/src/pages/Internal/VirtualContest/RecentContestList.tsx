import React from "react";
import { connect, PromiseState } from "react-refetch";
import { Button, Col, Row } from "reactstrap";
import { useHistory } from "react-router-dom";
import { useLoginState } from "../../../api/InternalAPIClient";
import { getCurrentUnixtimeInSecond } from "../../../utils/DateUtil";
import { VirtualContestTable } from "../VirtualContestTable";
import { CONTEST_RECENT } from "../ApiUrl";
import { VirtualContestInfo } from "../types";

interface InnerProps {
  contestListGet: PromiseState<VirtualContestInfo[]>;
}

export const RecentContestList = connect<unknown, InnerProps>(() => ({
  contestListGet: {
    url: CONTEST_RECENT,
  },
}))((props) => {
  const history = useHistory();
  const loginState = useLoginState();
  const contests = props.contestListGet.fulfilled
    ? props.contestListGet.value.sort(
        (a, b) => b.start_epoch_second - a.start_epoch_second
      )
    : [];
  const now = getCurrentUnixtimeInSecond();
  const future = contests.filter((c) => c.start_epoch_second > now);
  const current = contests.filter(
    (c) =>
      c.start_epoch_second <= now &&
      now < c.start_epoch_second + c.duration_second
  );
  const past = contests.filter(
    (c) => c.start_epoch_second + c.duration_second <= now
  );

  return (
    <>
      {loginState.data ? (
        <Row className="my-2">
          <Col sm="12">
            <Button
              color="success"
              onClick={(): void => {
                history.push({ pathname: "/contest/create" });
              }}
            >
              Create New Contest
            </Button>
          </Col>
        </Row>
      ) : null}

      <Row className="my-2  border-bottom">
        <Col sm="12">
          <h2>Running Contests</h2>
        </Col>
      </Row>
      <Row className="my-2">
        <Col sm="12">
          <VirtualContestTable
            contests={current.sort(
              (a, b) =>
                a.start_epoch_second +
                a.duration_second -
                (b.start_epoch_second + b.duration_second)
            )}
          />
        </Col>
      </Row>

      <Row className="mt-5 border-bottom">
        <Col sm="12">
          <h2>Upcoming Contests</h2>
        </Col>
      </Row>
      <Row className="my-2">
        <Col sm="12">
          <VirtualContestTable
            contests={future.sort(
              (a, b) => a.start_epoch_second - b.start_epoch_second
            )}
          />
        </Col>
      </Row>

      <Row className="mt-5 border-bottom">
        <Col sm="12">
          <h2>Recent Contests</h2>
        </Col>
      </Row>
      <Row className="my-2">
        <Col sm="12">
          <VirtualContestTable
            contests={past.sort(
              (a, b) =>
                b.start_epoch_second +
                b.duration_second -
                (a.start_epoch_second + a.duration_second)
            )}
          />
        </Col>
      </Row>
    </>
  );
});
