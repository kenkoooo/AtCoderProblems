import React from "react";
import { Row } from "reactstrap";
import { connect, PromiseState } from "react-refetch";
import { useRatingInfo } from "../../api/APIClient";
import Submission from "../../interfaces/Submission";
import * as CachedApiClient from "../../utils/CachedApiClient";
import { SubmissionListTable } from "../../components/SubmissionListTable";

interface OuterProps {
  userId: string;
}

interface InnerProps extends OuterProps {
  submissionsFetch: PromiseState<Submission[]>;
}

const InnerSubmissions: React.FC<InnerProps> = (props) => {
  const submissions = props.submissionsFetch.fulfilled
    ? props.submissionsFetch.value.sort((a, b) => b.id - a.id)
    : [];
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

export const Submissions = connect<OuterProps, InnerProps>(({ userId }) => ({
  submissionsFetch: {
    comparison: userId,
    value: CachedApiClient.cachedSubmissions(userId).then((list) =>
      list.toArray()
    ),
  },
}))(InnerSubmissions);
