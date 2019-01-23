import * as React from "react";
import { MergedProblem } from "../model/MergedProblem";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { DropdownSelect } from "./DropdownSelect";
import { Contest } from "../model/Contest";
import { Problem } from "../model/Problem";
import { HtmlFormatter } from "../utils/HtmlFormatter";
import { UrlFormatter } from "../utils/UrlFormatter";
import { Row, Label, ButtonToolbar, ToggleButtonGroup, ToggleButton } from "react-bootstrap";
import { Submission } from "../model/Submission";
import { TimeFormatter } from "../utils/TimeFormatter";

export interface ListProps {
  problems: Array<MergedProblem>;
  contests: Array<Contest>;
  submissions: Array<Submission>;
  userId: string;
  rivalsSet: Set<string>;
}

interface ListState {
  showTrying: boolean;
  showAccepted: boolean;
  onlyRated: boolean;
  pointFrom: number;
  pointTo: number;
}

interface ProblemRow {
  problem: MergedProblem;
  contest: Contest;
  solver: number;
  point: number;
  startEpochSecond: number;
  lastAcceptedDate: string;
}

enum ListFilter {
  All = "all",
  Trying = "trying",
  Accepted = "accepted",
  Rated = "rated"
}

const INF = 10000;

function formatProblemTitle(problem: Problem, row: ProblemRow) {
  let problemUrl = UrlFormatter.problemUrl(row.contest.id, problem.id);
  return HtmlFormatter.createLink(problemUrl, problem.title);
}

function formatContestTitle(problem: Problem, row: ProblemRow) {
  let contestUrl = UrlFormatter.contestUrl(row.contest.id);
  return HtmlFormatter.createLink(contestUrl, row.contest.title);
}

function formatFastestSubmission(problem: MergedProblem, row: ProblemRow) {
  if (problem.fastest_submission_id == null) return <span />;
  let submissionUrl = UrlFormatter.submissionUrl(
    problem.fastest_contest_id,
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
    problem.shortest_contest_id,
    problem.shortest_submission_id
  );
  let title = `${problem.shortest_user_id} (${problem.source_code_length} byte)`;
  return HtmlFormatter.createLink(submissionUrl, title);
}

function sortProblemRow(a: ProblemRow, b: ProblemRow, order: string): number {
  let ta: [number, string, string] = [a.startEpochSecond, a.contest.title, a.problem.title];
  let tb: [number, string, string] = [b.startEpochSecond, b.contest.title, b.problem.title];

  var result = 0;
  if (ta < tb) {
    result = -1;
  } else if (ta > tb) {
    result = 1;
  }

  if (order === 'desc') {
    result *= -1;
  }
  return result;
}

/**
 * format first submission link
 */
function formatFirstSubmission(problem: MergedProblem, row: ProblemRow) {
  if (problem.first_submission_id == null) return <span />;
  let submissionUrl = UrlFormatter.submissionUrl(
    problem.first_contest_id,
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

export class List extends React.Component<ListProps, ListState> {
  constructor(prop: ListProps) {
    super(prop);
    this.state = {
      showTrying: true,
      onlyRated: false,
      showAccepted: true,
      pointFrom: 0,
      pointTo: INF
    };
  }

  render() {
    let pointSet = new Set<number>();
    this.props.problems.forEach(p => {
      if (p.point) {
        pointSet.add(p.point);
      }
    });
    let pointList = Array.from(pointSet).sort((a, b) => a - b);

    // map of <contest_id, contest>
    let contestMap: Map<string, Contest> = new Map(
      this.props.contests.map(contest => {
        let pair: [string, Contest] = [contest.id, contest];
        return pair;
      })
    );

    let acceptedDateMap = new Map<string, string>();
    this.props.submissions
      .sort((a, b) => a.epoch_second - b.epoch_second)
      .filter(s => s.result === "AC")
      .filter(s => s.user_id === this.props.userId)
      .forEach(s =>
        acceptedDateMap.set(
          s.problem_id,
          TimeFormatter.getDateString(s.epoch_second * 1000)
        )
      );

    let wrongResultMap = new Map<string, string>();
    this.props.submissions
      .filter(s => s.result !== "AC")
      .filter(s => s.user_id === this.props.userId)
      .forEach(s => wrongResultMap.set(s.problem_id, s.result));

    let rivalsNameMap = new Map<string, Set<string>>();
    this.props.submissions
      .filter(s => s.result === "AC")
      .filter(s => this.props.rivalsSet.has(s.user_id))
      .forEach(s => {
        if (!rivalsNameMap.has(s.problem_id)) {
          rivalsNameMap.set(s.problem_id, new Set<string>());
        }
        rivalsNameMap.get(s.problem_id).add(s.user_id);
      });

    let data: Array<ProblemRow> = this.props.problems
      .filter(p => contestMap.has(p.contest_id))
      .filter(p => {
        if (this.state.onlyRated && contestMap.get(p.contest_id).rate_change.match(/[-×]/)) {
          return false;
        } else if (this.state.showAccepted && acceptedDateMap.has(p.id)) {
          return true;
        } else if (this.state.showTrying && !acceptedDateMap.has(p.id)) {
          return true;
        } else {
          return false;
        }
      })
      .filter(problem => {
        let point = problem.point
          ? problem.point
          : problem.predict ? problem.predict : INF;
        return this.state.pointFrom <= point && point <= this.state.pointTo;
      })
      .map(problem => {
        let contest = contestMap.get(problem.contest_id);
        let point = problem.point
          ? problem.point
          : problem.predict ? problem.predict : INF;
        let lastAcceptedDate = acceptedDateMap.get(problem.id);
        return {
          problem: problem,
          contest: contest,
          solver: problem.solver_count,
          point: point,
          startEpochSecond: contest.start_epoch_second,
          lastAcceptedDate: lastAcceptedDate ? lastAcceptedDate : ""
        };
      })
      .sort((a, b) => sortProblemRow(a, b, 'desc'));

    return (
      <Row>
        <ButtonToolbar>
          <ToggleButtonGroup
            type="radio"
            name="trying"
            defaultValue={ListFilter.All}
            onChange={(x: any) => {
              let value: ListFilter = x;
              switch (value) {
                case ListFilter.All:
                  this.setState({
                    showAccepted: true,
                    showTrying: true
                  });
                  break;
                case ListFilter.Accepted:
                  this.setState({
                    showAccepted: true,
                    showTrying: false
                  });
                  break;
                case ListFilter.Trying:
                  this.setState({
                    showAccepted: false,
                    showTrying: true
                  });
                  break;
                default:
                  break;
              }
            }}
          >
            <ToggleButton value={ListFilter.All}>All</ToggleButton>
            <ToggleButton value={ListFilter.Trying}>Only Trying</ToggleButton>
            <ToggleButton value={ListFilter.Accepted}>Only AC</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            type="checkbox"
            onChange={(e: any) => {
              let values: Array<ListFilter> = e;
              this.setState({
                onlyRated: values.includes(ListFilter.Rated)
              });
            }}
          >
            <ToggleButton value={ListFilter.Rated}>Only Rated</ToggleButton>
          </ToggleButtonGroup>
          <DropdownSelect
            defaultTitle="From"
            data={pointList}
            titleFormat={(p: number) => p.toString()}
            onSelect={(item: number) => this.setState({ pointFrom: item })}
          />
          <DropdownSelect
            defaultTitle="To"
            data={pointList}
            titleFormat={(p: number) => p.toString()}
            onSelect={(item: number) => this.setState({ pointTo: item })}
          />
        </ButtonToolbar>

        <BootstrapTable
          data={data}
          striped
          search
          trClassName={(row: any) => {
            let problem: MergedProblem = row.problem;
            if (acceptedDateMap.has(problem.id)) {
              return "success";
            } else if (rivalsNameMap.has(problem.id)) {
              return "danger";
            } else if (wrongResultMap.has(problem.id)) {
              return "warning";
            }
            return "";
          }}
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
                value: data.length
              }
            ]
          }}
        >
          <TableHeaderColumn
            dataField="startEpochSecond"
            dataFormat={(second: number) =>
              TimeFormatter.getDateString(second * 1000)
            }
            dataSort
            sortFunc={sortProblemRow}
            isKey
          >
            Date
          </TableHeaderColumn>
          <TableHeaderColumn
            dataField="problem"
            dataFormat={formatProblemTitle}
          >
            Problem
          </TableHeaderColumn>
          <TableHeaderColumn
            dataField="contest"
            dataFormat={formatContestTitle}
            dataSort
            sortFunc={sortProblemRow}
          >
            Contest
          </TableHeaderColumn>
          <TableHeaderColumn
            dataField="problem"
            dataFormat={p => {
              if (acceptedDateMap.has(p.id)) {
                return (
                  <h5>
                    <Label bsStyle="success">AC</Label>
                  </h5>
                );
              } else if (rivalsNameMap.has(p.id)) {
                return (
                  <h5>
                    {Array.from(rivalsNameMap.get(p.id)).map(userId => (
                      <Label bsStyle="danger">{userId}</Label>
                    ))}
                  </h5>
                );
              } else if (wrongResultMap.has(p.id)) {
                return (
                  <h5>
                    <Label bsStyle="warning">{wrongResultMap.get(p.id)}</Label>
                  </h5>
                );
              } else {
                return <span />;
              }
            }}
            dataAlign="center"
          >
            Result
          </TableHeaderColumn>
          <TableHeaderColumn
            dataField="lastAcceptedDate"
            dataAlign="left"
            dataSort
          >
            Last AC Date
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
            dataField="point"
            dataAlign="right"
            dataSort
            dataFormat={p => {
              if (p == INF) {
                return "-";
              } else {
                return p;
              }
            }}
          >
            Point
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
