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
import ProblemModel from "../../interfaces/ProblemModel";
import {DifficultyCircle} from "../../components/DifficultyCircle";

interface Props {
  contests: Map<string, Contest>;
  contestToProblems: Map<string, List<Problem>>;
  showSolved: boolean;
  showDifficulty: boolean;
  title: string;
  statusLabelMap: Map<ProblemId, ProblemStatus>;
  problemModels: Map<string, ProblemModel>;
}

function getColorClass (difficulty: number | null): string {
  if(difficulty === null) return "";
  if(difficulty < 400) return 'difficulty-grey'; // grey
  else if(difficulty < 800) return 'difficulty-brown'; // brown
  else if(difficulty < 1200) return 'difficulty-green'; // green
  else if(difficulty < 1600) return 'difficulty-cyan'; // cyan
  else if(difficulty < 2000) return 'difficulty-blue'; // blue
  else if(difficulty < 2400) return 'difficulty-yellow'; // yellow
  else if(difficulty < 2800) return 'difficulty-orange'; // orange
  else return 'difficulty-red'; // red
}

export const AtCoderRegularTable: React.FC<Props> = props => {
  const { contestToProblems, showSolved, showDifficulty, statusLabelMap, problemModels } = props;
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
            <a href={Url.formatContestUrl(contest.id)} target="_blank">
              {contest.id.toUpperCase()}
            </a>
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
              if(problem){
                if(showDifficulty){
                  const difficulty = problemModels.getIn([problem.id, "difficulty"], null);
                  return (<>
                    <DifficultyCircle
                      difficulty={difficulty}
                      id={problem.id + '-' + contest.id}
                    />
                    <a
                      href={Url.formatProblemUrl(problem.id, contest.id)}
                      target="_blank"
                      className={getColorClass(difficulty)}
                    >
                      {problem.title}
                    </a>
                  </>);
                } else {
                  return (
                    <a
                      href={Url.formatProblemUrl(problem.id, contest.id)}
                      target="_blank"
                    >
                      {problem.title}
                    </a>
                  );
                }
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
