import React from "react";
import { connect, PromiseState } from "react-refetch";
import { Button, Col, Row } from "reactstrap";
import VirtualContestTable from "../VirtualContestTable";
import { CONTEST_RECENT, USER_GET } from "../ApiUrl";
import { useHistory } from "react-router-dom";
import { VirtualContestInfo } from "../types";

interface InnerProps {
  contestListGet: PromiseState<VirtualContestInfo[]>;
  userInfoGet: PromiseState<{} | null>;
}

export const RecentContestList = connect<{}, InnerProps>(() => ({
  contestListGet: {
    url: CONTEST_RECENT
  },
  userInfoGet: {
    url: USER_GET
  }
}))(props => {
  const history = useHistory();
  const contests = props.contestListGet.fulfilled
    ? props.contestListGet.value.sort(
        (a, b) => b.start_epoch_second - a.start_epoch_second
      )
    : [];
  const now = Math.floor(Date.now() / 1000);
  const future = contests.filter(c => c.start_epoch_second > now);
  const current = contests.filter(
    c =>
      c.start_epoch_second <= now &&
      now < c.start_epoch_second + c.duration_second
  );
  const past = contests.filter(
    c => c.start_epoch_second + c.duration_second <= now
  );

  return (
    <>
      {props.userInfoGet.fulfilled && props.userInfoGet.value ? (
        <Row className="my-2">
          <Col sm="12">
            <Button
              color="success"
              onClick={() => {
                history.push({ pathname: "/contest/create" });
              }}
            >
              Create New Contest
            </Button>
          </Col>
        </Row>
      ) : null}

      <Row className="my-2">
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

      <Row className="my-2">
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

      <Row className="my-2">
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
