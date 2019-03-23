import React from "react";
import { Row, Table } from "reactstrap";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { isAccepted } from "../utils";

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

type ContestAndProblems = { contest: Contest; problems: ProblemWithStatus[] };

interface ProblemWithStatus extends Problem {
  status: Status;
  contest: Contest;
}

interface Props {
  user_ids: string[];
}

interface State {
  contests: Contest[];
  problems: ProblemWithStatus[];
}

class TablePage extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      contests: [],
      problems: []
    };
  }

  componentDidMount() {
    Promise.all([Api.fetchProblems(), Api.fetchContests()]).then(
      ([initialProblems, contests]) => {
        const contest_map = contests.reduce(
          (map, c) => map.set(c.id, c),
          new Map<string, Contest>()
        );
        const problems = initialProblems.map(p => {
          const contest = contest_map.get(p.contest_id);
          if (!contest) {
            throw `${p.contest_id} does not exist!`;
          }
          return { status: Status.Nothing, contest, ...p };
        });

        this.setState({ problems, contests }, () => {
          this.updateState(this.props.user_ids);
        });
      }
    );
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
          .map(({ problem_id, user_id, result }) => {
            if (user_id === user) {
              if (isAccepted(result)) {
                return { problem_id, status: Status.Solved };
              } else {
                return { problem_id, status: Status.Trying };
              }
            } else {
              return { problem_id, status: Status.RivalSolved };
            }
          })
          .sort((a, b) => a.status - b.status)
          .reduce(
            (map, s) => map.set(s.problem_id, s.status),
            new Map<string, Status>()
          )
      )
      .then(map => {
        const problems = this.state.problems.map(p => {
          const status = map.get(p.id);
          const problem = Object.assign({}, p);
          problem.status = Status.Nothing;
          if (status !== undefined) {
            problem.status = status;
          }
          return problem;
        });
        this.setState({ problems });
      });
  }

  render() {
    const [abc, arc] = createAtCoderBeginnerRegularContestTable(
      this.state.contests,
      this.state.problems
    );
    const agc = createAtCoderGrandContestTable(
      this.state.contests,
      this.state.problems
    );
    abc.forEach(row => {
      row.problems = row.problems.slice(0, 4);
    });
    arc.forEach(row => {
      const length = row.problems.length;
      row.problems = row.problems.slice(length - 4, length);
    });

    const other_contest_map = this.state.problems
      .filter(p => !p.contest.id.match(/^a[rgb]c\d{3}$/))
      .reduce((map, problem) => {
        const list = map.get(problem.contest.id);
        if (list) {
          list.push(problem);
        } else {
          map.set(problem.contest.id, [problem]);
        }
        return map;
      }, new Map<string, ProblemWithStatus[]>());

    const other_contests = Array.from(other_contest_map)
      .map(([_, problems]) => ({ contest: problems[0].contest, problems }))
      .sort(
        (a, b) => b.contest.start_epoch_second - a.contest.start_epoch_second
      );

    return (
      <div>
        <AtCoderRegularTable contests={abc} title="AtCoder Beginner Contest" />
        <AtCoderRegularTable contests={arc} title="AtCoder Regular Contest" />

        <Row>
          <h2>AtCoder Grand Contest</h2>
          <BootstrapTable data={agc} keyField="contest_id">
            <TableHeaderColumn
              dataField="contest_id"
              dataFormat={(contest_id: string) => (
                <a href={Url.formatContestUrl(contest_id)} target="_blank">
                  {contest_id.toUpperCase()}
                </a>
              )}
            >
              Contest
            </TableHeaderColumn>
            {"ABCDEF".split("").map((c, i) => (
              <TableHeaderColumn
                dataField={c}
                key={c}
                columnClassName={(
                  _: any,
                  { problems }: { problems: ProblemWithStatus[] }
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
                  row: { contest_id: string; problems: ProblemWithStatus[] }
                ) => {
                  const problem = row.problems[i];
                  if (problem) {
                    return (
                      <a
                        target="_blank"
                        href={Url.formatProblemUrl(
                          problem.id,
                          problem.contest_id
                        )}
                      >
                        {problem.title}
                      </a>
                    );
                  } else {
                    return "-";
                  }
                }}
              >
                {c}
              </TableHeaderColumn>
            ))}
          </BootstrapTable>
        </Row>
        <Row className="my-4">
          <h2>Other Contests</h2>
        </Row>
        <ContestTable contests={other_contests} />
      </div>
    );
  }
}

const ContestTable = ({ contests }: { contests: ContestAndProblems[] }) => (
  <div>
    {contests.map(({ contest, problems }) => (
      <div key={contest.id}>
        <h5>
          <strong>
            <a target="_blank" href={Url.formatContestUrl(contest.id)}>
              {contest.title}
            </a>
          </strong>
        </h5>
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
  contests: { contest_id: string; problems: ProblemWithStatus[] }[];
  title: string;
}) => (
  <Row className="my-4">
    <h2>{title}</h2>
    <BootstrapTable data={contests}>
      <TableHeaderColumn
        isKey
        dataField="contest_id"
        dataFormat={(
          _: any,
          row: { contest_id: string; problems: ProblemWithStatus[] }
        ) => (
          <a href={Url.formatContestUrl(row.contest_id)} target="_blank">
            {row.contest_id.toUpperCase()}
          </a>
        )}
      >
        Contest
      </TableHeaderColumn>
      {"ABCD".split("").map((c, i) => (
        <TableHeaderColumn
          dataField={c}
          key={c}
          columnClassName={(
            _: any,
            { problems }: { problems: ProblemWithStatus[] }
          ) => get_table_class(problems[i].status)}
          dataFormat={(
            _: any,
            { problems }: { contest_id: string; problems: ProblemWithStatus[] }
          ) => (
            <a
              href={Url.formatProblemUrl(
                problems[i].id,
                problems[i].contest_id
              )}
              target="_blank"
            >
              {problems[i].title}
            </a>
          )}
        >
          {c}
        </TableHeaderColumn>
      ))}
    </BootstrapTable>
  </Row>
);

const createAtCoderGrandContestTable = (
  contests: Contest[],
  problems: ProblemWithStatus[]
) => {
  const map = contests
    .filter(c => c.id.match(/^agc\d{3}$/))
    .reduce(
      (map, c) => map.set(c.id, []),
      new Map<string, ProblemWithStatus[]>()
    );

  problems
    .filter(p => p.id.match(/^agc\d{3}_\w$/))
    .forEach(p => {
      const contest_id = p.id.slice(0, 6);
      const list = map.get(contest_id);
      if (!list) {
        throw `${contest_id} does not exist!`;
      }
      list.push(p);
    });

  return Array.from(map)
    .map(([contest_id, problems]) => ({
      contest_id,
      problems: problems.sort((a, b) => a.id.localeCompare(b.id))
    }))
    .sort((a, b) => b.contest_id.localeCompare(a.contest_id));
};

const filter = (regexp: RegExp, contests: Contest[]) =>
  contests
    .filter(c => c.id.match(regexp))
    .reduce(
      (map, c) => map.set(c.start_epoch_second, { contest: c, problems: [] }),
      new Map<number, ContestAndProblems>()
    );

const pushToMap = (
  map: Map<number, ContestAndProblems>,
  problems: ProblemWithStatus[]
) => {
  problems.forEach(p => {
    const entry = map.get(p.contest.start_epoch_second);
    if (entry) {
      entry.problems.push(p);
    }
  });
};

const sortMap = (map: Map<number, ContestAndProblems>) =>
  Array.from(map.values())
    .sort(
      ({ contest: a }, { contest: b }) =>
        b.start_epoch_second - a.start_epoch_second
    )
    .map(({ contest, problems }) => {
      problems.sort((a, b) => a.id.localeCompare(b.id));
      return { contest_id: contest.id, problems };
    });

const createAtCoderBeginnerRegularContestTable = (
  contests: Contest[],
  problems: ProblemWithStatus[]
) => {
  const abc_map = filter(/^abc\d{3}$/, contests);
  const arc_map = filter(/^arc\d{3}$/, contests);

  pushToMap(abc_map, problems);
  pushToMap(arc_map, problems);

  const abc = sortMap(abc_map);
  const arc = sortMap(arc_map);

  return [abc, arc];
};

export default TablePage;
