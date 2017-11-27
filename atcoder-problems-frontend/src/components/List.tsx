import * as React from "react";
import { MergedProblem } from "../model/MergedProblem";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { Contest } from "../model/Contest";
import { Problem } from "../model/Problem";
import { HtmlFormatter } from "../utils/HtmlFormatter";
import { UrlFormatter } from "../utils/UrlFormatter";
import { url } from "inspector";

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

function formatFastestSubmission(problem: Problem, row: ProblemRow) {
  let contestUrl = UrlFormatter.contestUrl(row.contest);
  return HtmlFormatter.createLink(contestUrl, row.contest.title);
}

function formatShortestSubmission(problem: Problem, row: ProblemRow) {
  let contestUrl = UrlFormatter.contestUrl(row.contest);
  return HtmlFormatter.createLink(contestUrl, row.contest.title);
}

function formatFirstSubmission(problem: Problem, row: ProblemRow) {
  let contestUrl = UrlFormatter.contestUrl(row.contest);
  return HtmlFormatter.createLink(contestUrl, row.contest.title);
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
      let contest = contestMap.get(problem.contest_id);
      return { problem: problem, contest: contest };
    });

    return (
      <BootstrapTable data={data}>
        <TableHeaderColumn
          dataField="problem"
          dataFormat={formatProblemTitle}
          isKey
        >
          Problem
        </TableHeaderColumn>
        <TableHeaderColumn dataField="contest" dataFormat={formatContestTitle}>
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
    );
  }
}
