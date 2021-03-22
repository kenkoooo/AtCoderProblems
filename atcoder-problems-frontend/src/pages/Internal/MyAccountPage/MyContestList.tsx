import { Button, Col, Row } from "reactstrap";
import React from "react";
import { useHistory } from "react-router-dom";
import {
  useJoinedContests,
  useMyContests,
} from "../../../api/InternalAPIClient";
import { VirtualContestTable } from "../VirtualContestTable";

export const MyContestList = () => {
  const history = useHistory();
  const joinedContests = useJoinedContests().data ?? [];
  const ownedContests = useMyContests().data ?? [];
  return (
    <>
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
      <Row className="my-2">
        <Col sm="12">
          <h2>My Contests</h2>
        </Col>
      </Row>
      <Row className="my-2">
        <Col sm="12">
          <VirtualContestTable
            contests={
              ownedContests
                ? ownedContests.sort(
                    (a, b) =>
                      b.start_epoch_second +
                      b.duration_second -
                      a.start_epoch_second -
                      a.duration_second
                  )
                : []
            }
          />
        </Col>
      </Row>

      <Row className="my-2">
        <Col sm="12">
          <h2>Joined Contests</h2>
        </Col>
      </Row>
      <Row className="my-2">
        <Col sm="12">
          <VirtualContestTable
            contests={
              joinedContests
                ? joinedContests.sort(
                    (a, b) =>
                      b.start_epoch_second +
                      b.duration_second -
                      a.start_epoch_second -
                      a.duration_second
                  )
                : []
            }
          />
        </Col>
      </Row>
    </>
  );
};
