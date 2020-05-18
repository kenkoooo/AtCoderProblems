import { List, Map as ImmutableMap, Set } from "immutable";
import Contest from "../../interfaces/Contest";
import Problem from "../../interfaces/Problem";
import { Row } from "reactstrap";
import React from "react";
import {
  noneStatus,
  ProblemId,
  ProblemStatus,
  StatusLabel,
} from "../../interfaces/Status";
import {
  ColorMode,
  TableColor,
  statusToTableColor,
  combineTableColorList,
} from "../../utils/TableColor";
import ProblemLink from "../../components/ProblemLink";
import ContestLink from "../../components/ContestLink";
import ProblemModel from "../../interfaces/ProblemModel";
import SubmitTimespan from "../../components/SubmitTimespan";
import { ReactBootstrapTable } from "../../components/ReactBootstrapTable";

interface Props {
  contests: Contest[];
  contestToProblems: ImmutableMap<string, List<Problem>>;
  showSolved: boolean;
  showDifficulty: boolean;
  colorMode: ColorMode;
  title: string;
  statusLabelMap: Map<ProblemId, ProblemStatus>;
  problemModels: ImmutableMap<ProblemId, ProblemModel>;
  selectedLanguages: Set<string>;
}

const AtCoderRegularTableSFC: React.FC<Props> = (props) => {
  const { colorMode, selectedLanguages } = props;
  const contests = props.contests
    .map((contest) => {
      const problems = props.contestToProblems
        .get(contest.id, List<Problem>())
        .sort((a, b) => a.id.localeCompare(b.id));
      const problemStatus = problems.map((problem) => ({
        problem,
        status: props.statusLabelMap.get(problem.id) ?? noneStatus(),
        model: props.problemModels.get(problem.id),
      }));
      const cellColorList = problems.map((problem) => {
        const status = props.statusLabelMap.get(problem.id) ?? noneStatus();
        return statusToTableColor({
          colorMode,
          status,
          contest,
          selectedLanguages,
        });
      });
      const rowColor = combineTableColorList({
        colorMode,
        colorList: cellColorList,
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
        cellColorList,
      };
    })
    .filter(({ solvedAll }) => props.showSolved || !solvedAll)
    .sort(
      (a, b) => b.contest.start_epoch_second - a.contest.start_epoch_second
    );
  interface OneContest {
    contest: Contest;
    id: string;
    problemStatus: List<{
      problem: Problem;
      status: ProblemStatus;
      model: ProblemModel | undefined;
    }>;
    solvedAll: boolean;
    rowColor: TableColor;
    cellColorList: List<TableColor>;
  }
  const maxProblemCount = contests.reduce(
    (currentCount, { problemStatus }) =>
      Math.max(problemStatus.size, currentCount),
    0
  );
  const header = ["A", "B", "C", "D", "E", "F", "F2"].slice(0, maxProblemCount);
  return (
    <Row className="my-4">
      <h2>{props.title}</h2>
      <ReactBootstrapTable
        data={contests}
        keyField="id"
        wrapperClasses="contest-table-responsive contest-regular-table-responsive"
        columns={[
          {
            dataField: "id",
            headerAlign: "left",
            classes: (_: string, { rowColor }: OneContest): TableColor =>
              rowColor,
            formatter: function Formatter(
              _: any,
              { contest }: OneContest
            ): React.ReactElement {
              return (
                <ContestLink
                  contest={contest}
                  title={contest.id.toUpperCase()}
                />
              );
            },
            text: "Contest",
            // TODO: remove this escape hatch when the upstream typing is fixed
          } as any,
          ...header.map((c, i) => ({
            dataField: c,
            headerAlign: "left",
            classes: (
              _: any,
              { problemStatus, cellColorList }: OneContest
            ): string => {
              const problem = problemStatus.get(i);
              const cellColor = cellColorList.get(i, TableColor.None);
              return [
                "table-problem",
                !problem ? "table-problem-empty" : cellColor,
              ]
                .filter((nm) => nm)
                .join(" ");
            },
            formatter: (
              _: any,
              { contest, problemStatus }: OneContest
            ): string | React.ReactElement => {
              const problem = problemStatus.get(i);
              const model = problem ? problem.model : undefined;
              if (problem) {
                return (
                  <>
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
                  </>
                );
              } else {
                return "";
              }
            },
            text: c,
          })),
        ]}
      />
    </Row>
  );
};

export const AtCoderRegularTable = React.memo(AtCoderRegularTableSFC);
