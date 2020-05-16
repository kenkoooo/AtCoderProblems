import React from "react";
import { Alert, Row, Spinner } from "reactstrap";
import Submission from "../interfaces/Submission";
import { connect, PromiseState } from "react-refetch";
import { fetchRecentSubmissions } from "../utils/Api";
import { ProblemId } from "../interfaces/Status";
import ProblemModel from "../interfaces/ProblemModel";
import {
  cachedProblemMap,
  cachedProblemModels
} from "../utils/CachedApiClient";
import { convertMap } from "../utils/ImmutableMigration";
import Problem from "../interfaces/Problem";
import { SubmissionListTable } from "../components/SubmissionListTable";

interface Props {
  submissions: PromiseState<Submission[]>;
  problemModels: PromiseState<Map<ProblemId, ProblemModel>>;
  problems: PromiseState<Problem[]>;
}

const InnerRecentSubmissions: React.FC<Props> = props => {
  if (props.submissions.pending) {
    return <Spinner style={{ width: "3rem", height: "3rem" }} />;
  }
  if (props.submissions.rejected) {
    return <Alert color="danger">Failed to fetch contest info.</Alert>;
  }

  const submissions = props.submissions.value.sort((a, b) => b.id - a.id);
  const problems = props.problems.fulfilled
    ? props.problems.value
    : ([] as Problem[]);
  const problemModels = props.problemModels.fulfilled
    ? props.problemModels.value
    : new Map<ProblemId, ProblemModel>();

  return (
    <Row>
      <h1>Recent Submissions</h1>
      <SubmissionListTable
        submissions={submissions}
        problems={problems}
        problemModels={problemModels}
      />
    </Row>
  );
};

export const RecentSubmissions = connect<{}, Props>(() => ({
  submissions: {
    comparison: null,
    value: fetchRecentSubmissions
  },
  problemModels: {
    comparison: null,
    value: () => cachedProblemModels().then(map => convertMap(map))
  },
  problems: {
    comparison: null,
    value: () => cachedProblemMap().then(map => map.valueSeq().toArray())
  }
}))(InnerRecentSubmissions);
