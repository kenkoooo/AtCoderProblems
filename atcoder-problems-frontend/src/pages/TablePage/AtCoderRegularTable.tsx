import { List, Map } from "immutable";
import Contest from "../../interfaces/Contest";
import Problem from "../../interfaces/Problem";
import { Row } from "reactstrap";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import * as Url from "../../utils/Url";
import React from "react";
import {
  noneStatus,
  ProblemId,
  ProblemStatus,
  StatusLabel
} from "../../interfaces/State";
import { statusLabelToTableColor } from "./index";
import ProblemLink from "../../components/ProblemLink";
import ContestLink from "../../components/ContestLink";
import ProblemModel from "../../interfaces/ProblemModel";

interface Props {
  contests: Map<string, Contest>;
  contestToProblems: Map<string, List<Problem>>;
  showSolved: boolean;
  showDifficulty: boolean;
  title: string;
  statusLabelMap: Map<ProblemId, ProblemStatus>;
  problemModels: Map<ProblemId, ProblemModel>;
}

const AtCoderRegularTableSFC: React.FC<Props> = props => {
  const {
    contestToProblems,
    showSolved,
    statusLabelMap,
    showDifficulty,
    problemModels
  } = props;
  const solvedAll = (contest: Contest) => {
    return contestToProblems
      .get(contest.id, List<Problem>())
      .every(
        p =>
          statusLabelMap.get(p.id, noneStatus()).label === StatusLabel.Success
      );
  };
  const ithProblem = (contest: Contest, i: number) =>
    contestToProblems
      .get(contest.id, List<Problem>())
      .sort((a, b) => a.id.localeCompare(b.id))
      .get(i);
  const contests = props.contests
    .valueSeq()
    .filter(contest => showSolved || !solvedAll(contest))
    .sort((a, b) => b.start_epoch_second - a.start_epoch_second)
    .toArray();
  const maxProblemCount = contests.reduce(
    (currentCount, contest) =>
      Math.max(
        contestToProblems.get(contest.id, List<string>()).size,
        currentCount
      ),
    0
  );
  const header = ["A", "B", "C", "D", "E", "F", "F2"].slice(0, maxProblemCount);
  return (
    <Row className="my-4">
      <h2>{props.title}</h2>
      <BootstrapTable data={contests}>
        <TableHeaderColumn
          isKey
          dataField="id"
          columnClassName={(_: any, contest: Contest) =>
            solvedAll(contest) ? "table-success" : ""
          }
          dataFormat={(_: any, contest: Contest) => (
            <ContestLink contest={contest} title={contest.id.toUpperCase()} />
          )}
        >
          Contest
        </TableHeaderColumn>
        {header.map((c, i) => (
          <TableHeaderColumn
            dataField={c}
            key={c}
            columnClassName={(_: any, contest: Contest) => {
              const problem = ithProblem(contest, i);
              if (problem) {
                const status = statusLabelMap.get(problem.id, noneStatus());
                return statusLabelToTableColor(status.label);
              } else {
                return "";
              }
            }}
            dataFormat={(_: any, contest: Contest) => {
              const problem = ithProblem(contest, i);
              if (problem) {
                return (
                  <ProblemLink
                    difficulty={problemModels.getIn(
                      [problem.id, "difficulty"],
                      null
                    )}
                    showDifficulty={showDifficulty}
                    contestId={contest.id}
                    problemId={problem.id}
                    problemTitle={problem.title}
                  />
                );
              } else {
                return "";
              }
            }}
          >
            {c}
          </TableHeaderColumn>
        ))}
      </BootstrapTable>
    </Row>
  );
};

export const AtCoderRegularTable = React.memo(AtCoderRegularTableSFC);
