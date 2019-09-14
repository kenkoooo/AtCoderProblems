import React, { useState } from "react";
import State, { ProblemId } from "../interfaces/State";
import { connect } from "react-redux";
import { List, Map, Range } from "immutable";
import Submission from "../interfaces/Submission";
import { clipDifficulty, isAccepted } from "../utils";
import { RatingInfo, ratingInfoOf } from "../utils/RatingInfo";
import ProblemModel, {
  isProblemModelWithDifficultyModel,
  isProblemModelWithTimeModel
} from "../interfaces/ProblemModel";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import Problem from "../interfaces/Problem";
import ProblemLink from "../components/ProblemLink";
import * as Url from "../utils/Url";
import { formatMoment, parseSecond } from "../utils/DateUtil";
import {
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  UncontrolledButtonDropdown
} from "reactstrap";
import {
  formatPredictedSolveProbability,
  formatPredictedSolveTime,
  predictSolveProbability,
  predictSolveTime
} from "../utils/ProblemModelUtil";

type ReviewEntry = {
  readonly id: number;
  readonly problem_id: string;
  readonly contest_id: string;
  readonly epoch_second: number;
  readonly title: string;
  readonly point: number;

  readonly difficulty: number | null;
  readonly predictedSolveTime: number | null;
  readonly predictedSolveProbability: number | null;
};

const ReviewPage: React.FC<Props> = props => {
  const {
    userId,
    submissions,
    userRatingInfo,
    problemModels,
    problems
  } = props;
  const [lowestDifficulty, setLowestDifficulty] = useState(-1);
  const { internalRating } = userRatingInfo;
  const reviewEntries = submissions
    .valueSeq()
    .map(v =>
      v
        .filter(s => isAccepted(s.result))
        .filter(s => s.user_id === userId)
        .maxBy(s => s.id)
    )
    .filter((s: Submission | undefined): s is Submission => s !== undefined)
    .map(submission => {
      const { problem_id, contest_id, epoch_second, id, point } = submission;
      const problem = problems.get(problem_id);
      if (problem === undefined) {
        return null;
      }
      const { title } = problem;
      const problemModel = problemModels.get(problem_id);
      const difficulty = problemModel ? problemModel.difficulty : null;
      const predictedSolveTime =
        problemModel &&
        internalRating &&
        isProblemModelWithTimeModel(problemModel)
          ? predictSolveTime(problemModel, internalRating)
          : null;
      const predictedSolveProbability =
        problemModel &&
        isProblemModelWithDifficultyModel(problemModel) &&
        internalRating
          ? predictSolveProbability(problemModel, internalRating)
          : null;

      return {
        difficulty: difficulty ? clipDifficulty(difficulty) : null,
        id,
        problem_id,
        contest_id,
        epoch_second,
        title,
        point,
        predictedSolveProbability,
        predictedSolveTime
      };
    })
    .filter((entry: ReviewEntry | null): entry is ReviewEntry => entry !== null)
    .sortBy(x => x.id)
    .toList();
  return (
    <>
      <UncontrolledButtonDropdown>
        <DropdownToggle caret>
          {lowestDifficulty === -1 ? "Difficulty from" : lowestDifficulty}
        </DropdownToggle>
        <DropdownMenu>
          {Range(0, 3000, 400).map(d => (
            <DropdownItem key={d} onClick={() => setLowestDifficulty(d)}>
              {d.toString()}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </UncontrolledButtonDropdown>

      <BootstrapTable
        data={reviewEntries
          .toArray()
          .filter(
            e =>
              (e.difficulty && e.difficulty >= lowestDifficulty) ||
              lowestDifficulty <= 0
          )}
        keyField="id"
        height="auto"
        hover
        striped
        pagination
        options={{
          paginationPosition: "top",
          sizePerPage: 20,
          sizePerPageList: [
            {
              text: "20",
              value: 20
            },
            {
              text: "50",
              value: 50
            },
            {
              text: "100",
              value: 100
            },
            {
              text: "200",
              value: 200
            },
            {
              text: "All",
              value: reviewEntries.size
            }
          ]
        }}
      >
        <TableHeaderColumn
          dataField="problem_id"
          dataFormat={(_: ProblemId, entry: ReviewEntry) => (
            <ProblemLink
              problemId={entry.problem_id}
              contestId={entry.contest_id}
              problemTitle={entry.title}
              difficulty={entry.difficulty}
              showDifficulty={true}
            />
          )}
        >
          Problem
        </TableHeaderColumn>
        <TableHeaderColumn dataField="point" dataSort>
          Point
        </TableHeaderColumn>
        <TableHeaderColumn dataField="difficulty" dataSort>
          Difficulty
        </TableHeaderColumn>
        <TableHeaderColumn
          dataField="predictedSolveProbability"
          dataFormat={formatPredictedSolveProbability}
          dataSort
        >
          Solve Probability
        </TableHeaderColumn>
        <TableHeaderColumn
          dataField="predictedSolveTime"
          dataFormat={formatPredictedSolveTime}
          dataSort
        >
          Median Solve Time
        </TableHeaderColumn>
        <TableHeaderColumn
          dataSort
          dataField="epoch_second"
          dataFormat={(_: number, entry: ReviewEntry) => (
            <a
              target="_blank"
              href={Url.formatSubmissionUrl(entry.id, entry.contest_id)}
            >
              {formatMoment(parseSecond(entry.epoch_second))}
            </a>
          )}
        >
          Last Solved
        </TableHeaderColumn>
      </BootstrapTable>
    </>
  );
};

interface Props {
  userId: string;
  submissions: Map<ProblemId, List<Submission>>;
  userRatingInfo: RatingInfo;
  problemModels: Map<ProblemId, ProblemModel>;
  problems: Map<ProblemId, Problem>;
}

const stateToProps = (state: State) => ({
  userId: state.users.userId,
  submissions: state.submissions,
  userRatingInfo: ratingInfoOf(state.contestHistory),
  problemModels: state.problemModels,
  problems: state.problems
});

export default connect(stateToProps)(ReviewPage);
