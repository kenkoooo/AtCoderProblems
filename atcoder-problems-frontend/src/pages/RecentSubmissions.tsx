import React from "react";
import { Alert, Row, Spinner } from "reactstrap";
import { connect, PromiseState } from "react-refetch";
import Submission from "../interfaces/Submission";
import { fetchRecentSubmissions } from "../utils/Api";
import { SubmissionListTable } from "../components/SubmissionListTable";

interface Props {
  submissions: PromiseState<Submission[]>;
}

const InnerRecentSubmissions: React.FC<Props> = (props) => {
  if (props.submissions.pending) {
    return <Spinner style={{ width: "3rem", height: "3rem" }} />;
  }
  if (props.submissions.rejected) {
    return <Alert color="danger">Failed to fetch contest info.</Alert>;
  }

  const submissions = props.submissions.value.sort((a, b) => b.id - a.id);
  return (
    <Row>
      <h1>Recent Submissions</h1>
      <SubmissionListTable submissions={submissions} />
    </Row>
  );
};

export const RecentSubmissions = connect<unknown, Props>(() => ({
  submissions: {
    comparison: null,
    value: fetchRecentSubmissions,
  },
}))(InnerRecentSubmissions);
