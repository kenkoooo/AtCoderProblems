import React from "react";
import { Row } from "reactstrap";
import { useHistory, useLocation } from "react-router-dom";
import { List } from "immutable";
import { connect, PromiseState } from "react-refetch";
import { useLoginState } from "../../api/InternalAPIClient";
import Submission from "../../interfaces/Submission";
import { fetchUserSubmissions } from "../../utils/Api";
import { PROGRESS_RESET_LIST } from "../Internal/ApiUrl";
import { loggedInUserId } from "../../utils/UserState";
import { filterResetProgress, ProgressResetList } from "../Internal/types";
import { SmallTable } from "./SmallTable";
import { DifficultyTable } from "./DifficultyTable";
import { FilterParams, ProblemList } from "./ProblemList";

const InnerListPage: React.FC<InnerProps> = (props) => {
  const location = useLocation();
  const history = useHistory();

  const setExactPointFilter = (point: number): void => {
    const params = new URLSearchParams(location.search);
    params.set(FilterParams.FromPoint, point.toString());
    params.set(FilterParams.ToPoint, point.toString());
    history.push({ ...location, search: params.toString() });
  };
  const setDifficultyFilter = (from: number, to: number): void => {
    const params = new URLSearchParams(location.search);
    params.set(FilterParams.FromDifficulty, from.toString());
    params.set(FilterParams.ToDifficulty, to.toString());
    history.push({ ...location, search: params.toString() });
  };

  const submissions = props.submissionsFetch.fulfilled
    ? props.submissionsFetch.value
    : [];

  const loginState = useLoginState().data;
  const loginUserId = loggedInUserId(loginState);
  const progressReset =
    props.progressResetList.fulfilled && props.progressResetList.value
      ? props.progressResetList.value
      : undefined;
  const filteredSubmissions =
    progressReset && loginUserId
      ? filterResetProgress(submissions, progressReset, loginUserId)
      : submissions;

  return (
    <div>
      <Row className="my-2 border-bottom">
        <h1>Point Status</h1>
      </Row>
      <Row>
        <SmallTable
          submissions={filteredSubmissions}
          setFilterFunc={setExactPointFilter}
        />
      </Row>

      <Row className="my-2 border-bottom">
        <h1>Difficulty Status</h1>
      </Row>
      <Row>
        <DifficultyTable
          submissions={filteredSubmissions}
          setFilterFunc={setDifficultyFilter}
        />
      </Row>

      <ProblemList userId={props.userId} submissions={filteredSubmissions} />
    </div>
  );
};

interface OuterProps {
  readonly userId: string;
  readonly rivals: List<string>;
}

interface InnerProps extends OuterProps {
  readonly submissionsFetch: PromiseState<Submission[]>;
  readonly progressResetList: PromiseState<ProgressResetList | null>;
}

export const ListPage = connect<OuterProps, InnerProps>((props) => ({
  submissionsFetch: {
    comparison: [props.userId, props.rivals],
    value: Promise.all(
      props.rivals.push(props.userId).map((id) => fetchUserSubmissions(id))
    ).then((arrays: Submission[][]) => arrays.flatMap((array) => array)),
  },
  progressResetList: PROGRESS_RESET_LIST,
}))(InnerListPage);
