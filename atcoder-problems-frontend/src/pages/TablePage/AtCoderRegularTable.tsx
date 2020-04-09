import { List, Map, Set, Seq } from "immutable";
import Contest from "../../interfaces/Contest";
import Problem from "../../interfaces/Problem";
import { Row, Table } from "reactstrap";
import React from "react";
import {
  noneStatus,
  ProblemId,
  ProblemStatus,
  StatusLabel
} from "../../interfaces/Status";
import {
  ColorMode,
  TableColor,
  statusToTableColor,
  combineTableColorList
} from "../../utils/TableColor";
import ProblemLink from "../../components/ProblemLink";
import ContestLink from "../../components/ContestLink";
import ProblemModel from "../../interfaces/ProblemModel";
import SubmitTimespan from "../../components/SubmitTimespan";

interface Props {
  contests: Seq.Indexed<Contest>;
  contestToProblems: Map<string, List<Problem>>;
  showSolved: boolean;
  showDifficulty: boolean;
  colorMode: ColorMode;
  title: string;
  statusLabelMap: Map<ProblemId, ProblemStatus>;
  problemModels: Map<ProblemId, ProblemModel>;
  selectedLanguages: Set<string>;
}

const AtCoderRegularTableSFC: React.FC<Props> = props => {
  const { colorMode, selectedLanguages } = props;
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
      const cellColorList = problems.map(problem => {
        const status = props.statusLabelMap.get(problem.id, noneStatus());
        return statusToTableColor({
          colorMode,
          status,
          contest,
          selectedLanguages
        });
      });
      const rowColor = combineTableColorList({
        colorMode,
        colorList: cellColorList
      });
      const solvedAll = problemStatus.every(
        ({ status }) => status.label === StatusLabel.Success
      );
      return {
        contest,
        id: contest.id,
        problemStatus,
        solvedAll,
        rowColor,
        cellColorList
      };
    })
    .filter(({ solvedAll }) => props.showSolved || !solvedAll)
    .sort((a, b) => b.contest.start_epoch_second - a.contest.start_epoch_second)
    .toArray();

  const maxProblemCount = contests.reduce(
    (currentCount, { problemStatus }) =>
      Math.max(problemStatus.size, currentCount),
    0
  );
  const header = ["A", "B", "C", "D", "E", "F", "F2"].slice(0, maxProblemCount);
  return (
    <Row className="my-4">
      <h2>{props.title}</h2>
      <Table>
        <thead>
          <tr>
            <th>Contest</th>
            {header.map((c, i) => (
              <th key={i}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {contests.map(({ contest, problemStatus, cellColorList }, i) => (
            <tr key={i}>
              <th>
                <ContestLink
                  contest={contest}
                  title={contest.id.toUpperCase()}
                />
              </th>
              {header.map((c, j) => {
                const problem = problemStatus.get(j);
                const cellColor = cellColorList.get(j, TableColor.None);
                const className = [
                  "table-problem",
                  !problem ? "table-problem-empty" : cellColor
                ]
                  .filter(nm => nm)
                  .join(" ");

                const model = problem ? problem.model : undefined;
                if (problem) {
                  return (
                    <td key={j} className={className}>
                      <ProblemLink
                        difficulty={
                          model && model.difficulty !== undefined
                            ? model.difficulty
                            : null
                        }
                        isExperimentalDifficulty={
                          !!model && model.is_experimental
                        }
                        showDifficulty={props.showDifficulty}
                        contestId={contest.id}
                        problemId={problem.problem.id}
                        problemTitle={problem.problem.title}
                      />
                      <SubmitTimespan
                        contest={contest}
                        problemStatus={problem.status}
                        enableColorfulMode={
                          props.colorMode === ColorMode.ContestResult
                        }
                      />
                    </td>
                  );
                } else {
                  return <td key={j} className={className} />;
                }
              })}
            </tr>
          ))}
        </tbody>
      </Table>
    </Row>
  );
};

export const AtCoderRegularTable = React.memo(AtCoderRegularTableSFC);
