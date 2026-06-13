import React from "react";
import { Row } from "reactstrap";
import { useRatingInfo, useUserSubmission } from "../../api/APIClient";
import { SubmissionListTable } from "../../components/SubmissionListTable";

interface Props {
  userId: string;
}

export const Submissions: React.FC<Props> = (props) => {
  const submissions = useUserSubmission(props.userId) ?? [];
  const ratingInfo = useRatingInfo(props.userId);

  return (
    <Row>
      <SubmissionListTable
        submissions={submissions}
        userRatingInfo={ratingInfo}
      />
    </Row>
  );
};
