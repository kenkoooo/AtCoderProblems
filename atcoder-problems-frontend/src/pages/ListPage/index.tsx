import React from "react";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { Badge, Row } from "reactstrap";

import { isAccepted } from "../../utils";
import { formatDate } from "../../utils/DateFormat";
import * as Api from "../../utils/Api";
import * as Url from "../../utils/Url";
import MergedProblem from "../../interfaces/MergedProblem";
import Contest from "../../interfaces/Contest";
import Submission from "../../interfaces/Submission";
import SmallTable from "./SmallTable";

const INF_POINT = 1e18;

interface Problem extends MergedProblem {
  showing_point: number;
  date: string;

  contest: Contest;

  status: string;
  rivals: string[];

  last_ac_date: string;
}

interface Props {
  user_ids: string[];
}

interface State {
  problems: Problem[];
}

class ListPage extends React.Component<Props, State> {
  constructor(props: any) {
    super(props);
    this.state = {
      problems: []
    };
  }

  componentDidMount() {
    Promise.all([Api.fetchMergedProblems(), Api.fetchContests()]).then(
      ([merged_problems, contests]) => {
        const contest_map = contests.reduce(
          (map, contest) => map.set(contest.id, contest),
          new Map<string, Contest>()
        );

        const problems: Problem[] = merged_problems.map(problem => {
          const { point, predict } = problem;
          const showing_point = point ? point : predict ? predict : INF_POINT;

          const contest = (() => {
            const contest = contest_map.get(problem.contest_id);
            if (contest) {
              return contest;
            } else {
              throw `${problem.id} is not belonged to any contest.`;
            }
          })();

          const date = formatDate(contest.start_epoch_second);

          const status = "";
          const rivals: string[] = [];
          const last_ac_date = "";

          return {
            status,
            showing_point,
            contest,
            date,
            rivals,
            last_ac_date,
            ...problem
          };
        });

        problems.sort((a, b) => {
          if (a.contest.start_epoch_second == b.contest.start_epoch_second) {
            return b.title.localeCompare(a.title);
          } else {
            return b.contest.start_epoch_second - a.contest.start_epoch_second;
          }
        });

        this.setState({ problems }, () =>
          this.updateProblems(this.props.user_ids)
        );
      }
    );
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (prevProps.user_ids !== this.props.user_ids) {
      this.updateProblems(this.props.user_ids);
    }
  }

  updateProblems(user_ids: string[]) {
    return Promise.all(user_ids.map(Api.fetchSubmissions))
      .then(r => r.flat())
      .then(submissions => {
        const submission_map = submissions
          .sort((a, b) => a.epoch_second - b.epoch_second)
          .reduce((map, submission) => {
            const arr = map.get(submission.problem_id);
            if (arr) {
              arr.push(submission);
            } else {
              map.set(submission.problem_id, [submission]);
            }
            return map;
          }, new Map<string, Submission[]>());

        const user = user_ids.length > 0 ? user_ids[0] : "";
        const rivals = this.props.user_ids.slice(1);

        const problems = this.state.problems.map(problem => {
          const submissions = (() => {
            const s = submission_map.get(problem.id);
            return s ? s : [];
          })();

          const new_status = (() => {
            const mine = submissions.filter(s => s.user_id === user);
            if (mine.some(s => isAccepted(s.result))) {
              return "AC";
            } else if (mine.length > 0) {
              return mine[mine.length - 1].result;
            } else {
              return "";
            }
          })();

          const new_rivals_set = (() =>
            submissions
              .filter(s => rivals.includes(s.user_id))
              .filter(s => isAccepted(s.result))
              .reduce(
                (set, submission) => set.add(submission.user_id),
                new Set<string>()
              ))();
          const new_rivals = Array.from(new_rivals_set).sort();
          const new_ac_date = (() => {
            let s = submissions
              .filter(s => s.user_id === user)
              .filter(s => isAccepted(s.result))
              .reverse();
            if (s.length > 0) {
              return formatDate(s[0].epoch_second);
            } else {
              return "";
            }
          })();
          if (
            new_status !== problem.status ||
            new_rivals !== problem.rivals ||
            new_ac_date !== problem.last_ac_date
          ) {
            const new_problem = Object.assign({}, problem);
            new_problem.rivals = new_rivals;
            new_problem.status = new_status;
            new_problem.last_ac_date = new_ac_date;
            return new_problem;
          } else {
            return problem;
          }
        });

        this.setState({ problems });
      });
  }

  render() {
    const columns: {
      header: string;
      dataField: string;
      dataSort?: boolean;
      dataAlign?: "center";
      dataFormat?: (cell: any, row: Problem) => JSX.Element;
      hidden?: boolean;
    }[] = [
      {
        header: "Date",
        dataField: "date",
        dataSort: true
      },
      {
        header: "Problem",
        dataField: "title",
        dataSort: true,
        dataFormat: (_: string, row: Problem) => (
          <a
            href={Url.formatProblemUrl(row.id, row.contest_id)}
            target="_blank"
          >
            {row.title}
          </a>
        )
      },
      {
        header: "Contest",
        dataField: "contest_id",
        dataSort: true,
        dataFormat: (contest_id: string, problem: Problem) => (
          <a href={Url.formatContestUrl(contest_id)} target="_blank">
            {problem.contest.title}
          </a>
        )
      },
      {
        header: "Result",
        dataField: "id",
        dataAlign: "center",
        dataFormat: (id: string, problem: Problem) => {
          if (isAccepted(problem.status)) {
            return <Badge color="success">AC</Badge>;
          } else if (problem.rivals.length > 0) {
            return (
              <div>
                {problem.rivals.map(r => (
                  <Badge key={r} color="danger">
                    {r}
                  </Badge>
                ))}
              </div>
            );
          } else {
            return <Badge color="warning">{problem.status}</Badge>;
          }
        }
      },
      {
        header: "Last AC Date",
        dataField: "last_ac_date",
        dataSort: true
      },
      {
        header: "Solvers",
        dataField: "solver_count",
        dataSort: true,
        dataFormat: (cell: number | null, row: Problem) => (
          <a
            href={Url.formatSolversUrl(row.contest_id, row.id)}
            target="_blank"
          >
            {cell}
          </a>
        )
      },
      {
        header: "Point",
        dataField: "showing_point",
        dataSort: true,
        dataFormat: (showing_point: any) => {
          if (showing_point >= INF_POINT) {
            return "-";
          } else {
            if (showing_point % 100 == 0) {
              return showing_point;
            } else {
              return showing_point.toFixed(2);
            }
          }
        }
      },
      {
        header: "Fastest",
        dataField: "execution_time",
        dataSort: true,
        dataFormat: (_: number, row: Problem) => {
          const {
            fastest_submission_id,
            fastest_contest_id,
            fastest_user_id,
            execution_time
          } = row;
          if (
            fastest_submission_id != null &&
            fastest_contest_id != null &&
            fastest_user_id != null &&
            execution_time != null
          ) {
            return (
              <a
                href={Url.formatSubmissionUrl(
                  fastest_submission_id,
                  fastest_contest_id
                )}
                target="_blank"
              >
                {fastest_user_id} ({execution_time} ms)
              </a>
            );
          } else {
            return <p />;
          }
        }
      },
      {
        header: "Shortest",
        dataField: "source_code_length",
        dataSort: true,
        dataFormat: (_: number, row: Problem) => {
          const {
            shortest_submission_id,
            shortest_contest_id,
            shortest_user_id,
            source_code_length
          } = row;
          if (
            shortest_contest_id != null &&
            shortest_submission_id != null &&
            shortest_user_id != null &&
            source_code_length != null
          ) {
            return (
              <a
                href={Url.formatSubmissionUrl(
                  shortest_submission_id,
                  shortest_contest_id
                )}
                target="_blank"
              >
                {shortest_user_id} ({source_code_length} Bytes)
              </a>
            );
          } else {
            return <p />;
          }
        }
      },
      {
        header: "First",
        dataField: "first_user_id",
        dataSort: true,
        dataFormat: (_: string, row: Problem) => {
          const { first_submission_id, first_contest_id, first_user_id } = row;
          if (
            first_submission_id != null &&
            first_contest_id != null &&
            first_user_id != null
          ) {
            return (
              <a
                href={Url.formatSubmissionUrl(
                  first_submission_id,
                  first_contest_id
                )}
                target="_blank"
              >
                {first_user_id}
              </a>
            );
          } else {
            return <p />;
          }
        }
      },
      {
        header: "Shortest User for Search",
        dataField: "shortest_user_id",
        hidden: true
      },
      {
        header: "Fastest User for Search",
        dataField: "fastest_user_id",
        hidden: true
      }
    ];
    return (
      <div>
        <Row>
          <SmallTable
            problems={this.state.problems}
            user_id={this.props.user_ids[0]}
          />
        </Row>
        <Row>
          <BootstrapTable
            pagination
            keyField="id"
            height="auto"
            hover
            striped
            search
            trClassName={(problem: Problem) => {
              if (isAccepted(problem.status)) {
                return "table-success";
              } else if (problem.rivals.length > 0) {
                return "table-danger";
              } else if (problem.status.length > 0) {
                return "table-warning";
              } else {
                return "";
              }
            }}
            data={this.state.problems}
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
                  value: this.state.problems.length
                }
              ]
            }}
          >
            {columns.map(c => (
              <TableHeaderColumn key={c.header} {...c}>
                {c.header}
              </TableHeaderColumn>
            ))}
          </BootstrapTable>
        </Row>
      </div>
    );
  }
}

export default ListPage;
