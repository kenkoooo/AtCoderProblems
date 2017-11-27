import * as React from "react";
import { MergedProblem } from "../model/MergedProblem";
import {
  BootstrapTable,
  TableHeaderColumn,
  SortOrder
} from "react-bootstrap-table";
import { Contest } from "../model/Contest";
import { Problem } from "../model/Problem";
import { HtmlFormatter } from "../utils/HtmlFormatter";
import { UrlFormatter } from "../utils/UrlFormatter";
import { Row, Button, Label, PageHeader } from "react-bootstrap";
import { Submission } from "../model/Submission";

export interface ListProps {
  problems: Array<MergedProblem>;
  contests: Array<Contest>;
  acceptedProblems: Set<string>;
  wrongMap: Map<string, string>;
  rivalMap: Map<string, Set<string>>;
}

interface ProblemRow {
  problem: MergedProblem;
  contest: Contest;
  solver: number;
}

function formatProblemTitle(problem: Problem, row: ProblemRow) {
  let problemUrl = UrlFormatter.problemUrl(row.contest, problem);
  return HtmlFormatter.createLink(problemUrl, problem.title);
}

function formatContestTitle(problem: Problem, row: ProblemRow) {
  let contestUrl = UrlFormatter.contestUrl(row.contest);
  return HtmlFormatter.createLink(contestUrl, row.contest.title);
}

function formatFastestSubmission(problem: MergedProblem, row: ProblemRow) {
  if (problem.fastest_submission_id == null) return <span />;
  let submissionUrl = UrlFormatter.submissionUrl(
    row.contest,
    problem.fastest_submission_id
  );
  let title = `${problem.fastest_user_id} (${problem.execution_time} ms)`;
  return HtmlFormatter.createLink(submissionUrl, title);
}

/**
 * format shortest submission link
 */
function formatShortestSubmission(problem: MergedProblem, row: ProblemRow) {
  if (problem.shortest_submission_id == null) return <span />;
  let submissionUrl = UrlFormatter.submissionUrl(
    row.contest,
    problem.shortest_submission_id
  );
  let title = `${problem.shortest_user_id} (${
    problem.source_code_length
  } byte)`;
  return HtmlFormatter.createLink(submissionUrl, title);
}

/**
 * format first submission link
 */
function formatFirstSubmission(problem: MergedProblem, row: ProblemRow) {
  if (problem.first_submission_id == null) return <span />;
  let submissionUrl = UrlFormatter.submissionUrl(
    row.contest,
    problem.first_submission_id
  );
  let title = `${problem.first_user_id}`;
  return HtmlFormatter.createLink(submissionUrl, title);
}

/**
 * format solver count link
 */
function formatSolver(solver: number, row: ProblemRow) {
  let solverUrl = UrlFormatter.solverUrl(row.contest, row.problem);
  let title = `${solver}`;
  return HtmlFormatter.createLink(solverUrl, title);
}

function formatResultBadge(
  problem: Problem,
  accepted: Set<string>,
  wrong: Map<string, string>,
  rivals: Map<string, Set<string>>
) {
  if (accepted.has(problem.id)) {
    return (
      <h5>
        <Label bsStyle="success">AC</Label>
      </h5>
    );
  } else if (rivals.has(problem.id)) {
    return (
      <h5>
        {Array.from(rivals.get(problem.id)).map(userId => (
          <Label bsStyle="danger">{userId}</Label>
        ))}
      </h5>
    );
  } else if (wrong.has(problem.id)) {
    return (
      <h5>
        <Label bsStyle="warning">{wrong.get(problem.id)}</Label>
      </h5>
    );
  } else {
    return <span />;
  }
}

function sortBySolverCount(
  a: ProblemRow,
  b: ProblemRow,
  order: SortOrder
): number {
  if (order === "desc") {
    return -a.problem.solver_count + b.problem.solver_count;
  } else {
    return a.problem.solver_count - b.problem.solver_count;
  }
}

export class List extends React.Component<ListProps, {}> {
  render() {
    let contestMap = new Map(
      this.props.contests.map(contest => {
        let pair: [string, Contest] = [contest.id, contest];
        return pair;
      })
    );

    let data: Array<ProblemRow> = this.props.problems
      .filter(p => contestMap.has(p.contestId))
      .map(problem => {
        let contest = contestMap.get(problem.contestId);
        return {
          problem: problem,
          contest: contest,
          solver: problem.solver_count
        };
      });

    let badgeFormatter = (p: Problem) =>
      formatResultBadge(
        p,
        this.props.acceptedProblems,
        this.props.wrongMap,
        this.props.rivalMap
      );

    return (
      <Row>
        <PageHeader />
        <BootstrapTable data={data} striped search>
          <TableHeaderColumn
            dataField="problem"
            dataFormat={formatProblemTitle}
            isKey
          >
            Problem
          </TableHeaderColumn>
          <TableHeaderColumn
            dataField="contest"
            dataFormat={formatContestTitle}
          >
            Contest
          </TableHeaderColumn>
          <TableHeaderColumn
            dataField="problem"
            dataFormat={badgeFormatter}
            dataAlign="center"
          >
            Result
          </TableHeaderColumn>
          <TableHeaderColumn
            dataField="solver"
            dataFormat={formatSolver}
            dataAlign="right"
            dataSort
          >
            Solvers
          </TableHeaderColumn>
          <TableHeaderColumn
            dataField="problem"
            dataFormat={formatFastestSubmission}
          >
            Fastest
          </TableHeaderColumn>
          <TableHeaderColumn
            dataField="problem"
            dataFormat={formatShortestSubmission}
          >
            Shortest
          </TableHeaderColumn>
          <TableHeaderColumn
            dataField="problem"
            dataFormat={formatFirstSubmission}
          >
            First
          </TableHeaderColumn>
        </BootstrapTable>
      </Row>
    );
  }
}
