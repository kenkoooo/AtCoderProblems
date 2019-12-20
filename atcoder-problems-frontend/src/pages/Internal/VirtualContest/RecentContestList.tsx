import React from "react";
import { connect, PromiseState } from "react-refetch";
import { VirtualContest } from "./types";
import { Button, Col, Row } from "reactstrap";
import VirtualContestTable from "../VirtualContestTable";
import { CONTEST_RECENT, USER_GET } from "../ApiUrl";
import { useHistory } from "react-router-dom";

interface InnerProps {
  contestListGet: PromiseState<VirtualContest[]>;
  userInfoGet: PromiseState<{}>;
}

export default connect<{}, InnerProps>(() => ({
  contestListGet: {
    url: CONTEST_RECENT
  },
  userInfoGet: {
    url: USER_GET
  }
}))(props => {
  const history = useHistory();
  const contests = props.contestListGet.fulfilled
    ? props.contestListGet.value
    : [];
  return (
    <>
      {props.userInfoGet.fulfilled ? (
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
          <h2>Recent Contests</h2>
        </Col>
      </Row>
      <Row className="my-2">
        <Col sm="12">
          <VirtualContestTable contests={contests} />
        </Col>
      </Row>
    </>
  );
});
