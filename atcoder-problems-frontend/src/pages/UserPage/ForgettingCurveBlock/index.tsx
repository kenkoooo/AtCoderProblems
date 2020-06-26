import React, { useState } from "react";
import moment from "moment";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { Button, ButtonGroup, Row } from "reactstrap";
import ProblemLink from "../../../components/ProblemLink";
import Submission from "../../../interfaces/Submission";
import MergedProblem from "../../../interfaces/MergedProblem";
import { ProblemId } from "../../../interfaces/Status";
import ProblemModel from "../../../interfaces/ProblemModel";
import { isAccepted } from "../../../utils";
import { groupBy } from "../../../utils/GroupBy";
import { formatMomentDateTime } from "../../../utils/DateUtil";

interface Props {
  readonly userSubmissions: Submission[];
  readonly problemModels: Map<ProblemId, ProblemModel>;
  readonly mergedProblems: Map<string, MergedProblem>;
}

const maxSuggestProblemSize = 10;
interface ProblemSolveInfo {
  problemId: string;
  solveCount: number;
  latestAcceptedDate: moment.Moment;
}
interface ForgetProblems {
  solveCount: number;
  suggestedProblems: ProblemSolveInfo[];
}

interface ForgetConfig {
  solveCount: number;
  forgetDay: number;
}
const forgetConfigs: ForgetConfig[] = [
  { solveCount: 1, forgetDay: 30 },
  { solveCount: 2, forgetDay: 180 },
];

const parseProblemSolveInfos = (
  userSubmissions: Submission[]
): ProblemSolveInfo[] => {
  const acceptedSubmissions = userSubmissions.filter((submission) =>
    isAccepted(submission.result)
  );
  const acceptedSubmissionsByProblem = groupBy(
    acceptedSubmissions,
    (s) => s.problem_id
  );

  return Array.from(acceptedSubmissionsByProblem).map(
    ([problemId, submissions]) => {
      const solveCount = submissions.length;
      const latestAcceptedDate = moment.unix(
        Math.max(...submissions.map((submission) => submission.epoch_second))
      );
      return { problemId, solveCount, latestAcceptedDate };
    }
  );
};

const pickupForgetProblems = (
  problemSolvedInfos: ProblemSolveInfo[]
): ForgetProblems[] => {
  const problemSolvedInfosBySolveCount = groupBy(
    problemSolvedInfos,
    (s) => s.solveCount
  );

  return forgetConfigs
    .map(({ solveCount, forgetDay }) => {
      const forgetDuration = moment.duration(forgetDay, "days");
      const forgetDate = moment().subtract(forgetDuration);
      const solveCountMatchedProblems =
        problemSolvedInfosBySolveCount.get(solveCount) || [];

      const suggestedProblems = solveCountMatchedProblems
        .filter((problem) => problem.latestAcceptedDate <= forgetDate)
        .sort((l, r) => {
          const lval = l.latestAcceptedDate;
          const rval = r.latestAcceptedDate;
          if (lval < rval) return 1;
          if (lval > rval) return -1;
          return 0;
        })
        .splice(0, maxSuggestProblemSize);

      return { solveCount, suggestedProblems };
    })
    .sort((l, r) => {
      const lval = l.solveCount;
      const rval = r.solveCount;
      if (lval < rval) return -1;
      if (lval > rval) return 1;
      return 0;
    });
};

export const ForgettingCurveBlock: React.FC<Props> = (props) => {
  const { userSubmissions, problemModels, mergedProblems } = props;

  const [focusedSolvedCount, setFocusedSolvedCount] = useState(1);

  const problemSolveInfos = parseProblemSolveInfos(userSubmissions);
  const forgetProblems = pickupForgetProblems(problemSolveInfos);
  const focusedForgetProblems =
    forgetProblems.find((elem) => elem.solveCount === focusedSolvedCount)
      ?.suggestedProblems || [];

  return (
    <>
      <Row className="my-3 d-flex justify-content-between">
        <div>
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
        </div>
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
