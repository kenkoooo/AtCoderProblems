import React, { useState } from "react";
import moment from "moment";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { Button, ButtonGroup, Col, Row } from "reactstrap";

import ProblemLink from "../../../components/ProblemLink";
import Submission from "../../../interfaces/Submission";
import MergedProblem from "../../../interfaces/MergedProblem";
import { ProblemId } from "../../../interfaces/Status";
import ProblemModel from "../../../interfaces/ProblemModel";
import { formatMomentDateTime } from "../../../utils/DateUtil";
import { DifficultyDropDown, INF_POINT } from "./DifficultyDropdown";
import { findForgetProblems } from "./FindForgetProblems";
const maxSuggestProblemSize = 10;

interface Props {
  readonly userSubmissions: Submission[];
  readonly problemModels: Map<ProblemId, ProblemModel>;
  readonly mergedProblems: Map<string, MergedProblem>;
}

export const ForgettingCurveBlock: React.FC<Props> = (props) => {
  const { userSubmissions, problemModels, mergedProblems } = props;

  const [focusedSolvedCount, setFocusedSolvedCount] = useState(1);
  const [fromDifficulty, setFromDifficulty] = useState(-1);
  const [toDifficulty, setToDifficulty] = useState(INF_POINT);

  const forgetProblems = findForgetProblems(userSubmissions, problemModels);
  const focusedForgetProblems = (
    forgetProblems.find((elem) => elem.solveCount === focusedSolvedCount)
      ?.suggestedProblems || []
  )
    .filter(
      ({ difficulty }) =>
        fromDifficulty <= difficulty && difficulty <= toDifficulty
    )
    .slice(0, maxSuggestProblemSize);

  return (
    <>
      <Row className="my-3 d-flex justify-content-between">
        <Col>
          {forgetProblems.map((forgetProblem) => (
            <ButtonGroup key={forgetProblem.solveCount}>
              <Button
                onClick={(): void =>
                  setFocusedSolvedCount(forgetProblem.solveCount)
                }
                active={focusedSolvedCount === forgetProblem.solveCount}
              >
                {`Solved ${forgetProblem.solveCount} times`}
              </Button>
            </ButtonGroup>
          ))}
        </Col>
        <Col>
          <DifficultyDropDown
            fromDifficulty={fromDifficulty}
            setFromDifficulty={setFromDifficulty}
            toDifficulty={toDifficulty}
            setToDifficulty={setToDifficulty}
          />
        </Col>
      </Row>
      <Row className="my-3">
        <BootstrapTable
          data={focusedForgetProblems}
          keyField="problemId"
          height="auto"
        >
          <TableHeaderColumn
            dataField="latestAcceptedDate"
            dataFormat={(submitDate: moment.Moment): string =>
              formatMomentDateTime(submitDate)
            }
          >
            Latest Accepted Date
          </TableHeaderColumn>
          <TableHeaderColumn
            dataField="latestAcceptedDate"
            dataFormat={(submitDate: moment.Moment): string =>
              `${moment().diff(submitDate, "day")}days ago`
            }
          >
            Date Difference
          </TableHeaderColumn>
          <TableHeaderColumn
            dataField="problemId"
            dataFormat={(problemId: string): React.ReactElement => {
              const problem = mergedProblems.get(problemId);
              return (
                <ProblemLink
                  difficulty={problemModels.get(problemId)?.difficulty}
                  isExperimentalDifficulty={
                    problemModels.get(problemId)?.is_experimental
                  }
                  showDifficulty={true}
                  problemId={problemId}
                  problemTitle={problem?.title || ""}
                  contestId={problem?.contest_id || ""}
                />
              );
            }}
          >
            Problem
          </TableHeaderColumn>
        </BootstrapTable>
      </Row>
    </>
  );
};
