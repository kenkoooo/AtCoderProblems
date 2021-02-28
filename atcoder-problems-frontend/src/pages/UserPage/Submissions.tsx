import React from "react";
import { Row } from "reactstrap";
import { connect, PromiseState } from "react-refetch";
import { List, Map as ImmutableMap } from "immutable";
import Submission from "../../interfaces/Submission";
import { ProblemId } from "../../interfaces/Status";
import ProblemModel from "../../interfaces/ProblemModel";
import {
  cachedSubmissions,
  cachedProblemMap,
  cachedProblemModels,
  cachedRatingInfo,
} from "../../utils/CachedApiClient";
import { convertMap } from "../../utils/ImmutableMigration";
import { RatingInfo, ratingInfoOf } from "../../utils/RatingInfo";
import Problem from "../../interfaces/Problem";
import { SubmissionListTable } from "../../components/SubmissionListTable";

interface OuterProps {
  userId: string;
}

interface InnerProps extends OuterProps {
  submissionsFetch: PromiseState<List<Submission>>;
  problemsFetch: PromiseState<Problem[]>;
  problemModelsFetch: PromiseState<ImmutableMap<ProblemId, ProblemModel>>;
  ratingInfoFetch: PromiseState<RatingInfo>;
}

const InnerSubmissions: React.FC<InnerProps> = (props) => {
  const submissions = props.submissionsFetch.fulfilled
    ? props.submissionsFetch.value.sort((a, b) => b.id - a.id).toArray()
    : [];
  const problems = props.problemsFetch.fulfilled
    ? props.problemsFetch.value
    : [];
  const problemModels = props.problemModelsFetch.fulfilled
    ? convertMap(props.problemModelsFetch.value)
    : new Map<ProblemId, ProblemModel>();
  const ratingInfo = props.ratingInfoFetch.fulfilled
    ? props.ratingInfoFetch.value
    : ratingInfoOf(List());

  return (
    <Row>
      <SubmissionListTable
        submissions={submissions}
        problems={problems}
        problemModels={problemModels}
        userRatingInfo={ratingInfo}
      />
    </Row>
  );
};

export const Submissions = connect<OuterProps, InnerProps>(({ userId }) => ({
  submissionsFetch: {
    comparison: userId,
    value: cachedSubmissions(userId),
  },
  problemModelsFetch: {
    value: cachedProblemModels(),
  },
  problemsFetch: {
    comparison: null,
    value: (): Promise<Problem[]> =>
      cachedProblemMap().then((map) => map.valueSeq().toArray()),
  },
  ratingInfoFetch: {
    comparison: userId,
    value: cachedRatingInfo(userId),
  },
}))(InnerSubmissions);
