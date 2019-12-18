import { List, Map, Seq } from "immutable";
import Contest from "../../interfaces/Contest";
import Problem from "../../interfaces/Problem";
import { Row } from "reactstrap";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import React from "react";
import {
  noneStatus,
  ProblemId,
  ProblemStatus,
  StatusLabel
} from "../../interfaces/Status";
import { statusLabelToTableColor } from "./index";
import ProblemLink from "../../components/ProblemLink";
import ContestLink from "../../components/ContestLink";
import ProblemModel from "../../interfaces/ProblemModel";

interface Props {
  contests: Seq.Indexed<Contest>;
  contestToProblems: Map<string, List<Problem>>;
  showSolved: boolean;
  showDifficulty: boolean;
  title: string;
  statusLabelMap: Map<ProblemId, ProblemStatus>;
  problemModels: Map<ProblemId, ProblemModel>;
}

const AtCoderRegularTableSFC: React.FC<Props> = props => {
  const contests = props.contests
    .valueSeq()
    .map(contest => {
      const problems = props.contestToProblems
        .get(contest.id, List<Problem>())
        .sort((a, b) => a.id.localeCompare(b.id));
      const problemStatus = problems.map(problem => ({
        problem,
        status: props.statusLabelMap.get(problem.id, noneStatus()),
        model: props.problemModels.get(problem.id)
      }));
      const solvedAll = problemStatus.every(
        ({ status }) => status.label === StatusLabel.Success
      );
      return { contest, problemStatus, solvedAll, id: contest.id };
    })
    .filter(({ solvedAll }) => props.showSolved || !solvedAll)
    .sort((a, b) => b.contest.start_epoch_second - a.contest.start_epoch_second)
    .toArray();
  type OneContest = {
    contest: Contest;
    id: String;
    problemStatus: List<{
      problem: Problem;
      status: ProblemStatus;
      model: ProblemModel | undefined;
    }>;
    solvedAll: boolean;
  };

  const maxProblemCount = contests.reduce(
    (currentCount, { problemStatus }) =>
      Math.max(problemStatus.size, currentCount),
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
          columnClassName={(_: string, { solvedAll }: OneContest) =>
            solvedAll ? "table-success" : ""
          }
          dataFormat={(_: any, { contest }: OneContest) => (
            <ContestLink contest={contest} title={contest.id.toUpperCase()} />
          )}
        >
          Contest
        </TableHeaderColumn>
        {header.map((c, i) => (
          <TableHeaderColumn
            dataField={c}
            key={c}
            columnClassName={(_: any, { problemStatus }: OneContest) => {
              const problem = problemStatus.get(i);
              return problem
                ? statusLabelToTableColor(problem.status.label)
                : "";
            }}
            dataFormat={(_: any, { contest, problemStatus }: OneContest) => {
              const problem = problemStatus.get(i);
              const model = problem ? problem.model : undefined;
              if (problem) {
                return (
                  <ProblemLink
                    difficulty={
                      model && model.difficulty !== undefined
                        ? model.difficulty
                        : null
                    }
                    isExperimentalDifficulty={!!model && model.is_experimental}
                    showDifficulty={props.showDifficulty}
                    contestId={contest.id}
                    problemId={problem.problem.id}
                    problemTitle={problem.problem.title}
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
