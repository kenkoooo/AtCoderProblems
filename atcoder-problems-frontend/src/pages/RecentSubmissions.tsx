import React from "react";
import { Alert, Row, Spinner } from "reactstrap";
import { useRecentSubmissions } from "../api/APIClient";
import { SubmissionListTable } from "../components/SubmissionListTable";

export const RecentSubmissions = () => {
  const submissionsResponse = useRecentSubmissions();

  if (!submissionsResponse.data && !submissionsResponse.error) {
    return <Spinner style={{ width: "3rem", height: "3rem" }} />;
  } else if (!submissionsResponse.data) {
    return <Alert color="danger">Failed to fetch submission info.</Alert>;
  }

  const submissions = submissionsResponse.data.sort((a, b) => b.id - a.id);

  return (
    <Row>
      <h1>Recent Submissions</h1>
      <SubmissionListTable submissions={submissions} />
    </Row>
  );
};
