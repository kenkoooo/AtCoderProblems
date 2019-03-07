import React from "react";
import { Row } from "reactstrap";

const BootstrapTable = require("react-bootstrap-table-next").default;
const paginationFactory = require("react-bootstrap-table2-paginator").default;

import * as Api from "../utils/Api";
import * as Url from "../utils/Url";
import MergedProblem from "../interfaces/MergedProblem";
import Contest from "../interfaces/Contest";

const INF_POINT = 1e18;

interface ListProblem extends MergedProblem {
  date: string;
  contest?: Contest;
  showing_point: number;
}

interface Props {
  user_ids: string[];
}

interface State {
  problems: MergedProblem[];
  contests: Contest[];
}

class ListPage extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      problems: [],
      contests: []
    };
  }

  componentDidMount() {
    Promise.all([Api.fetchMergedProblems(), Api.fetchContests()]).then(
      result => {
        const [ps, contests] = result;
        const contestMap = contests.reduce(
          (map, contest) => map.set(contest.id, contest),
          new Map<string, Contest>()
        );

        const problems = ps.map(problem => {
          const p = problem as ListProblem;
          p.contest = contestMap.get(p.contest_id);
          if (p.contest) {
            p.date = new Date(p.contest.start_epoch_second * 1000).toLocaleDateString('ja-JP');
          }
          if (p.point) {
            p.showing_point = p.point;
          } else if (p.predict) {
            p.showing_point = p.predict;
          } else {
            p.showing_point = INF_POINT;
          }
          return p;
        });
        problems.sort((a, b) => {
          if (a.contest && b.contest) {
            if (a.contest.start_epoch_second == b.contest.start_epoch_second) {
              if (a.title < b.title) {
                return 1;
              } else if (a.title > b.title) {
                return -1;
              } else {
                return 0;
              }
            } else {
              return b.contest.start_epoch_second - a.contest.start_epoch_second;
            }
          } else {
            return 0;
          }
        });
        this.setState({ problems, contests });
      }
    );
  }

  render() {
    const columns = [
      {
        dataField: "date",
        text: "Date",
        sort: true,
      },
      {
        dataField: "title",
        text: "Problem",
        formatter: (_: string, row: ListProblem) => (
          <a
            href={Url.formatProblemUrl(row.id, row.contest_id)}
            target="_blank"
          >
            {row.title}
          </a>
        )
      },
      {
        dataField: "contest_id",
        text: "Contest",
        formatter: (cell: string, row: ListProblem) => (
          <a href={Url.formatContestUrl(cell)} target="_blank">
            {row.contest ? row.contest.title : ""}
          </a>
        ),
        sort: true,
      },
      {
        dataField: "a",
        text: "Result"
      },
      {
        dataField: "b",
        text: "Last AC Date"
      },
      {
        dataField: "solver_count",
        text: "Solvers",
        formatter: (cell: number, row: ListProblem) => (
          <a href={Url.formatSolversUrl(row.contest_id, row.id)} target="_blank">{cell}</a>
        ),
        sort: true
      },
      {
        dataField: "showing_point",
        text: "Point",
        sort: true,
        formatter: (cell: number) => {
          if (cell >= INF_POINT) {
            return "-";
          } else {
            if (cell % 100 == 0) {
              return cell;
            } else {
              return cell.toFixed(2);
            }
          }
        }
      },
      {
        dataField: "execution_time",
        text: "Fastest",
        formatter: (_: number, row: ListProblem) => (
          <a
            href={Url.formatSubmissionUrl(
              row.fastest_submission_id,
              row.fastest_contest_id
            )}
            target="_blank"
          >
            {row.fastest_user_id} ({row.execution_time} ms)
          </a>
        ),
        sort: true
      },
      {
        dataField: "source_code_length",
        text: "Shortest",
        formatter: (_: number, row: ListProblem) => (
          <a
            href={Url.formatSubmissionUrl(
              row.shortest_submission_id,
              row.shortest_contest_id
            )}
            target="_blank"
          >
            {row.shortest_user_id} ({row.source_code_length} Bytes)
          </a>
        ),
        sort: true
      },
      {
        dataField: "first_user_id",
        text: "First",
        formatter: (_: string, row: ListProblem) => (
          <a
            href={Url.formatSubmissionUrl(
              row.first_submission_id,
              row.first_contest_id
            )}
            target="_blank"
          >
            {row.first_user_id}
          </a>
        )
      }
    ];
    const options = {
      sizePerPageList: [
        {
          text: "25",
          value: 25
        },
        {
          text: "50",
          value: 50
        },
        {
          text: "100",
          value: 100
        }
      ]
    };
    return (
      <Row>
        <BootstrapTable
          keyField="id"
          columns={columns}
          data={this.state.problems}
          pagination={paginationFactory(options)}
        />
      </Row>
    );
  }
}
export default ListPage;
