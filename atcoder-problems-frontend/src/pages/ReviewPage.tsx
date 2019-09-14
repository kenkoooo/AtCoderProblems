import React, { useState } from "react";
import State, { ProblemId } from "../interfaces/State";
import { connect } from "react-redux";
import { List, Map, Range } from "immutable";
import Submission from "../interfaces/Submission";
import { clipDifficulty, isAccepted } from "../utils";
import { RatingInfo, ratingInfoOf } from "../utils/RatingInfo";
import ProblemModel from "../interfaces/ProblemModel";
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
import ButtonGroup from "reactstrap/lib/ButtonGroup";

type ReviewEntry = {
  id: number;
  problem_id: string;
  contest_id: string;
  difficulty: number;
  epoch_second: number;
  title: string;
  point: number;
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
  if (internalRating === null) {
    return <></>;
  }
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
      if (problemModel === undefined) {
        return null;
      }
      const { difficulty } = problemModel;
      if (difficulty === undefined) {
        return null;
      }
      return {
        difficulty: clipDifficulty(difficulty),
        id,
        problem_id,
        contest_id,
        epoch_second,
        title,
        point
      };
    })
    .filter((entry: ReviewEntry | null): entry is ReviewEntry => entry !== null)
    .sortBy(x => x.id)
    .toList();
  return (
    <>
      <UncontrolledButtonDropdown>
        <DropdownToggle caret>
          {lowestDifficulty === -1 ? "Lowest Difficulty" : lowestDifficulty}
        </DropdownToggle>
        <DropdownMenu>
          {Range(0, 3000, 400).map(d => (
            <DropdownItem key={d} onClick={() => setLowestDifficulty(d)}>
              {d}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </UncontrolledButtonDropdown>

      <BootstrapTable
        data={reviewEntries
          .toArray()
          .filter(e => e.difficulty >= lowestDifficulty)}
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
