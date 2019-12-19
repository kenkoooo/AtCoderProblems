import React from "react";
import { connect, PromiseState } from "react-refetch";
import { VirtualContest } from "./types";
import { Col, Row } from "reactstrap";
import VirtualContestTable from "../VirtualContestTable";
import { CONTEST_RECENT } from "../ApiUrl";

interface InnerProps {
  contestListGet: PromiseState<VirtualContest[]>;
}

export default connect<{}, InnerProps>(() => ({
  contestListGet: {
    url: CONTEST_RECENT
  }
}))(props => {
  const contests = props.contestListGet.fulfilled
    ? props.contestListGet.value
    : [];
  return (
    <Row my="2">
      <Col sm="12">
        <VirtualContestTable contests={contests} />
      </Col>
    </Row>
  );
});
