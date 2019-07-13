import React from "react";
import {FormGroup, Input, Label, Row, Table} from "reactstrap";
import {BootstrapTable, TableHeaderColumn} from "react-bootstrap-table";
import {isAccepted} from "../utils";

import * as Api from "../utils/Api";
import * as Url from "../utils/Url";
import Contest from "../interfaces/Contest";
import Problem from "../interfaces/Problem";

enum Status {
  Nothing = 0,
  Trying = 1,
  RivalSolved = 2,
  Solved = 3
}

const get_table_class = (status: Status) => {
  switch (status) {
    case Status.Nothing:
      return "";
    case Status.Solved:
      return "table-success";
    case Status.Trying:
      return "table-warning";
    case Status.RivalSolved:
      return "table-danger";
  }
};

type ContestWithProblemIds = { contest: Contest; problemIds: string[] };
type ContestWithProblems = { id: string; problems: ProblemWithStatus[] };

interface ProblemWithStatus extends Problem {
  status: Status;
}

interface Props {
  user_ids: string[];
}

interface State {
  contests: ContestWithProblemIds[];
  problems: Map<string, ProblemWithStatus>;
  showSolved: boolean;
}

class TablePage extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      contests: [],
      problems: new Map(),
      showSolved: true,
    };
  }

  componentDidMount() {
    Promise.all([
      Api.fetchProblems(),
      Api.fetchContests(),
      Api.fetchContestProblemPairs()
    ]).then(([problems, contests, edges]) => {
      const graph = edges.reduce((map, edge) => {
        const list = map.get(edge.contest_id);
        if (list) {
          list.push(edge.problem_id);
        } else {
          map.set(edge.contest_id, [edge.problem_id]);
        }
        return map;
      }, new Map<string, string[]>());

      const problemsMap = problems
        .map(p => ({status: Status.Nothing, ...p}))
        .reduce(
          (map, p) => map.set(p.id, p),
          new Map<string, ProblemWithStatus>()
        );

      const contestsWithProblemIds = contests.map(contest => {
        const problemIds = graph.get(contest.id);
        if (problemIds) {
          return {contest, problemIds};
        } else {
          return {contest, problemIds: []};
        }
      });

      this.setState(
        {contests: contestsWithProblemIds, problems: problemsMap},
        () => {
          this.updateState(this.props.user_ids);
        }
      );
    });
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props !== prevProps) {
      this.updateState(this.props.user_ids);
    }
  }

  updateState(user_ids: string[]) {
    const user = user_ids.length > 0 ? user_ids[0] : "";
    const rivals = user_ids.slice(1);

    Promise.all(user_ids.map(user_id => Api.fetchSubmissions(user_id)))
      .then(r => r.flat())
      .then(submissions =>
        submissions
          .filter(
            s =>
              s.user_id === user ||
              (rivals.includes(s.user_id) && isAccepted(s.result))
          )
          .map(({problem_id, user_id, result}) => {
            if (user_id === user) {
              if (isAccepted(result)) {
                return {problem_id, status: Status.Solved};
              } else {
                return {problem_id, status: Status.Trying};
              }
            } else {
              return {problem_id, status: Status.RivalSolved};
            }
          })
          .sort((a, b) => a.status - b.status)
          .reduce(
            (map, s) => map.set(s.problem_id, s.status),
            new Map<string, Status>()
          )
      )
      .then(map => {
        const problems = Array.from(this.state.problems.values())
          .map(p => {
            const status = map.get(p.id);
            const problem = Object.assign({}, p);
            problem.status = Status.Nothing;
            if (status !== undefined) {
              problem.status = status;
            }
            return problem;
          })
          .reduce(
            (map, p) => map.set(p.id, p),
            new Map<string, ProblemWithStatus>()
          );
        this.setState({problems});
      });
  }

  render() {
    const {problems, contests, showSolved} = this.state;
    const contestsWithProblems = contests
      .map(({contest, problemIds}) => {
        const problemList: ProblemWithStatus[] = [];
        problemIds
          .map(id => problems.get(id))
          .forEach(problem => {
            if (problem) {
              problemList.push(problem);
            }
          });
        return {
          problems: problemList.sort((a, b) => a.title.localeCompare(b.title)),
          ...contest
        };
      }).filter(c => {
        const solvedAll = c.problems.every(p => p.status === Status.Solved);
        return showSolved || !solvedAll;
      })
      .sort((a, b) => b.start_epoch_second - a.start_epoch_second);

    const abc = contestsWithProblems.filter(({id}) => id.match(/^abc\d{3}$/));
    const arc = contestsWithProblems.filter(({id}) => id.match(/^arc\d{3}$/));
    const agc = contestsWithProblems.filter(({id}) => id.match(/^agc\d{3}$/));
    const others = contestsWithProblems.filter(({id}) =>
      id.match(/^(?!a[rgb]c\d{3}).*$/)
    );

    return (
      <div>
        <Row className="my-4">
          <FormGroup check>
            <Label check>
              <Input type="checkbox" checked={showSolved} onChange={() => this.setState({showSolved: !showSolved})}/>
              Show Accepted
            </Label>
          </FormGroup>
        </Row>
        <AtCoderRegularTable contests={abc} title="AtCoder Beginner Contest"/>
        <AtCoderRegularTable contests={arc} title="AtCoder Regular Contest"/>
        <AtCoderRegularTable contests={agc} title="AtCoder Grand Contest"/>

        <Row className="my-4">
          <h2>Other Contests</h2>
        </Row>
        <ContestTable contests={others}/>
      </div>
    );
  }
}

const ContestTable = ({
                        contests
                      }: {
  contests: { id: string; title: string; problems: ProblemWithStatus[] }[];
}) => (
  <div>
    {contests.map(({id, title, problems}) => (
      <div key={id}>
        <strong>
          <a target="_blank" href={Url.formatContestUrl(id)}>
            {title}
          </a>
        </strong>
        <Table striped bordered hover responsive>
          <tbody>
          <tr>
            {problems
              .sort((a, b) => a.title.localeCompare(b.title))
              .map(p => (
                <td key={p.id} className={get_table_class(p.status)}>
                  <a
                    target="_blank"
                    href={Url.formatProblemUrl(p.id, p.contest_id)}
                  >
                    {p.title}
                  </a>
                </td>
              ))}
          </tr>
          </tbody>
        </Table>
      </div>
    ))}
  </div>
);

const AtCoderRegularTable = ({
                               contests,
                               title
                             }: {
  contests: ContestWithProblems[];
  title: string;
}) => {
  const max_problem_count = contests
    .map(c => c.problems.length)
    .reduce((current, count) => Math.max(current, count), 0);
  const problem_heads = ["A", "B", "C", "D", "E", "F", "F2"].slice(
    0,
    max_problem_count
  );

  return (
    <Row className="my-4">
      <h2>{title}</h2>
      <BootstrapTable data={contests}>
        <TableHeaderColumn
          isKey
          dataField="id"
          columnClassName={(
            _: any,
            {problems}: ContestWithProblems
          ) => {
            if (problems.every(p => p.status === Status.Solved)) {
              return get_table_class(Status.Solved);
            } else {
              return "";
            }
          }}
          dataFormat={(
            _: any,
            row: ContestWithProblems
          ) => (
            <a href={Url.formatContestUrl(row.id)} target="_blank">
              {row.id.toUpperCase()}
            </a>
          )}
        >
          Contest
        </TableHeaderColumn>
        {problem_heads.map((c, i) => (
          <TableHeaderColumn
            dataField={c}
            key={c}
            columnClassName={(
              _: any,
              {problems}: ContestWithProblems
            ) => {
              const problem = problems[i];
              if (problem) {
                return get_table_class(problems[i].status);
              } else {
                return "";
              }
            }}
            dataFormat={(
              _: any,
              {id, problems}: ContestWithProblems
            ) => {
              const problem = problems[i];
              if (problem) {
                return (
                  <a
                    href={Url.formatProblemUrl(problems[i].id, id)}
                    target="_blank"
                  >
                    {problems[i].title}
                  </a>
                );
              } else {
                return "";
              }
            }}
          >
            {c}
          </TableHeaderColumn>
        ))}
      </BootstrapTable>
    </Row>
  );
};

export default TablePage;
