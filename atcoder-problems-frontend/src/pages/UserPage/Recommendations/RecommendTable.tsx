import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import React from "react";
import Problem from "../../../interfaces/Problem";
import { HelpBadgeTooltip } from "../../../components/HelpBadgeTooltip";
import {
  formatPredictedSolveProbability,
  formatPredictedSolveTime,
} from "../../../utils/ProblemModelUtil";
import { ProblemId } from "../../../interfaces/Status";
import { selectRowPropsForProblemSelection } from "../../../utils/ProblemSelection";
import { RecommendedProblem } from "./RecommendProblems";

interface Props {
  filteredRecommendedProblems: RecommendedProblem[];
  isLoggedIn: boolean;
  getSelectedProblemIds: () => ProblemId[];
  selectProblemIds: (ids: ProblemId[]) => void;
  deselectProblemIds: (ids: ProblemId[]) => void;
  formatProblemName: (
    title: string,
    {
      id,
      contest_id,
      is_experimental,
    }: { id: string; contest_id: string; is_experimental: boolean }
  ) => React.ReactElement;
  formatContestName: (
    contestId: string,
    problem: Problem
  ) => React.ReactElement;
}

export const RecommendTable = (props: Props) => {
  const selectRowProps = selectRowPropsForProblemSelection(
    props.getSelectedProblemIds(),
    props.getSelectedProblemIds,
    props.selectProblemIds,
    props.deselectProblemIds
  );

  return (
    <BootstrapTable
      data={props.filteredRecommendedProblems}
      keyField="id"
      height="auto"
      hover
      striped
      selectRow={props.isLoggedIn ? selectRowProps : undefined}
    >
      <TableHeaderColumn dataField="title" dataFormat={props.formatProblemName}>
        Problem
      </TableHeaderColumn>
      <TableHeaderColumn
        dataField="contest_id"
        dataFormat={props.formatContestName}
      >
        Contest
      </TableHeaderColumn>
      <TableHeaderColumn
        dataField="difficulty"
        dataFormat={(difficulty: number | null): string => {
          if (difficulty === null) {
            return "-";
          }
          return String(difficulty);
        }}
      >
        <span>Difficulty</span>
        &nbsp;
        <HelpBadgeTooltip id="difficulty">
          Internal rating to have 50% Solve Probability
        </HelpBadgeTooltip>
      </TableHeaderColumn>
      <TableHeaderColumn
        dataField="predictedSolveProbability"
        dataFormat={formatPredictedSolveProbability}
      >
        <span>Solve Probability</span>
        &nbsp;
        <HelpBadgeTooltip id="probability">
          Estimated probability that you could solve this problem if you
          competed in the contest.
        </HelpBadgeTooltip>
      </TableHeaderColumn>
      <TableHeaderColumn
        dataField="predictedSolveTime"
        dataFormat={formatPredictedSolveTime}
      >
        <span>Median Solve Time</span>
        &nbsp;
        <HelpBadgeTooltip id="solvetime">
          Estimated time required to solve this problem.
        </HelpBadgeTooltip>
      </TableHeaderColumn>
    </BootstrapTable>
  );
};
