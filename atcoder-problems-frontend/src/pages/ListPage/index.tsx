import React from "react";
import { Row } from "reactstrap";
import { useHistory, useLocation } from "react-router-dom";
import { useMultipleUserSubmissions } from "../../api/APIClient";
import {
  useLoginState,
  useProgressResetList,
} from "../../api/InternalAPIClient";
import { loggedInUserId } from "../../utils/UserState";
import { filterResetProgress } from "../Internal/types";
import { SmallTable } from "./SmallTable";
import { DifficultyTable } from "./DifficultyTable";
import { FilterParams, ProblemList } from "./ProblemList";

interface Props {
  readonly userId: string;
  readonly rivals: string[];
}

export const ListPage: React.FC<Props> = (props) => {
  const location = useLocation();
  const history = useHistory();

  const users = [...props.rivals, props.userId];
  const submissions = useMultipleUserSubmissions(users).data ?? [];
  const progressReset = useProgressResetList().data;

  const setPointFilter = (from: number, to: number): void => {
    const params = new URLSearchParams(location.search);
    params.set(FilterParams.FromPoint, from.toString());
    params.set(FilterParams.ToPoint, to.toString());
    history.push({ ...location, search: params.toString() });
  };

  const setDifficultyFilter = (from: number, to: number): void => {
    const params = new URLSearchParams(location.search);
    params.set(FilterParams.FromDifficulty, from.toString());
    params.set(FilterParams.ToDifficulty, to.toString());
    history.push({ ...location, search: params.toString() });
  };

  const loginState = useLoginState().data;
  const loginUserId = loggedInUserId(loginState);
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
          setFilterFunc={setPointFilter}
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
