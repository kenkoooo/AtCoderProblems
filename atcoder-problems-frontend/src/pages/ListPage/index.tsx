import React from "react";
import { Row } from "reactstrap";
import { useHistory, useLocation } from "react-router-dom";
import { List, Map } from "immutable";
import { connect, PromiseState } from "react-refetch";
import ProblemModel from "../../interfaces/ProblemModel";
import { ProblemId } from "../../interfaces/Status";
import Submission from "../../interfaces/Submission";
import MergedProblem from "../../interfaces/MergedProblem";
import * as CachedApiClient from "../../utils/CachedApiClient";
import { fetchUserSubmissions } from "../../utils/Api";
import { loggedInUserId } from "../../utils/UserState";
import { PROGRESS_RESET_LIST, USER_GET } from "../Internal/ApiUrl";
import {
  filterResetProgress,
  ProgressResetList,
  UserResponse,
} from "../Internal/types";
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

  const { mergedProblemMapFetch, problemModelsFetch, submissionsFetch } = props;

  const mergedProblemMap = mergedProblemMapFetch.fulfilled
    ? mergedProblemMapFetch.value
    : Map<ProblemId, MergedProblem>();
  const problemModels = problemModelsFetch.fulfilled
    ? problemModelsFetch.value
    : Map<ProblemId, ProblemModel>();
  const submissions = submissionsFetch.fulfilled ? submissionsFetch.value : [];

  const loginUserId = loggedInUserId(props.loginState);
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
          mergedProblems={mergedProblemMap}
          submissions={filteredSubmissions}
          setFilterFunc={setExactPointFilter}
        />
      </Row>

      <Row className="my-2 border-bottom">
        <h1>Difficulty Status</h1>
      </Row>
      <Row>
        <DifficultyTable
          mergedProblems={mergedProblemMap}
          submissions={filteredSubmissions}
          problemModels={problemModels}
          setFilterFunc={setDifficultyFilter}
        />
      </Row>

      <ProblemList
        userId={props.userId}
        submissions={filteredSubmissions}
        mergedProblemMap={mergedProblemMap}
        problemModels={problemModels}
      />
    </div>
  );
};

interface OuterProps {
  readonly userId: string;
  readonly rivals: List<string>;
}

interface InnerProps extends OuterProps {
  readonly submissionsFetch: PromiseState<Submission[]>;
  readonly mergedProblemMapFetch: PromiseState<Map<ProblemId, MergedProblem>>;
  readonly problemModelsFetch: PromiseState<Map<ProblemId, ProblemModel>>;

  readonly loginState: PromiseState<UserResponse | null>;
  readonly progressResetList: PromiseState<ProgressResetList | null>;
}

export const ListPage = connect<OuterProps, InnerProps>((props) => ({
  submissionsFetch: {
    comparison: [props.userId, props.rivals],
    value: Promise.all(
      props.rivals.push(props.userId).map((id) => fetchUserSubmissions(id))
    ).then((arrays: Submission[][]) => arrays.flatMap((array) => array)),
  },
  mergedProblemMapFetch: {
    value: CachedApiClient.cachedMergedProblemMap(),
  },
  problemModelsFetch: {
    value: CachedApiClient.cachedProblemModels(),
  },
  loginState: USER_GET,
  progressResetList: PROGRESS_RESET_LIST,
}))(InnerListPage);
