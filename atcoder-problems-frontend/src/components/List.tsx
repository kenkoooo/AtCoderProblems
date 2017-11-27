import * as React from "react";
import { MergedProblem } from "../model/MergedProblem";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { Contest } from "../model/Contest";
import { Problem } from "../model/Problem";
import { HtmlFormatter } from "../utils/HtmlFormatter";
import { UrlFormatter } from "../utils/UrlFormatter";
import { url } from "inspector";
import { Row } from "react-bootstrap";

export interface ListProps {
  problems: Array<MergedProblem>;
  contests: Array<Contest>;
}

interface ProblemRow {
  problem: Problem;
  contest: Contest;
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
  let submissionUrl = UrlFormatter.submissionUrl(
    row.contest,
    problem.fastest_submission_id
  );
  let title = `${problem.fastest_user_id} (${problem.execution_time} ms)`;
  return HtmlFormatter.createLink(submissionUrl, title);
}

function formatShortestSubmission(problem: MergedProblem, row: ProblemRow) {
  let submissionUrl = UrlFormatter.submissionUrl(
    row.contest,
    problem.shortest_submission_id
  );
  let title = `${problem.shortest_user_id} (${
    problem.source_code_length
  } byte)`;
  return HtmlFormatter.createLink(submissionUrl, title);
}

function formatFirstSubmission(problem: MergedProblem, row: ProblemRow) {
  let submissionUrl = UrlFormatter.submissionUrl(
    row.contest,
    problem.first_submission_id
  );
  let title = `${problem.first_user_id}`;
  return HtmlFormatter.createLink(submissionUrl, title);
}

export class List extends React.Component<ListProps, {}> {
  render() {
    let contestMap = new Map(
      this.props.contests.map(contest => {
        let pair: [string, Contest] = [contest.id, contest];
        return pair;
      })
    );

    let data = this.props.problems.map(problem => {
      let contest = contestMap.get(problem.contestId);
      return { problem: problem, contest: contest };
    });

    return (
      <Row>
        <BootstrapTable data={data}>
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
