import React from "react";
import { FormGroup, Input, Label, Row, Table } from "reactstrap";
import { BootstrapTable, TableHeaderColumn } from "react-bootstrap-table";
import { isAccepted } from "../utils";
import { connect } from "react-redux";

import * as Url from "../utils/Url";
import Contest from "../interfaces/Contest";
import Problem from "../interfaces/Problem";
import State from "../interfaces/State";
import { Dispatch } from "redux";
import { List, Map } from "immutable";
import {
  requestContestProblemPair,
  requestContests,
  requestProblems
} from "../actions";
import Submission from "../interfaces/Submission";

const getProblemStatusString = (
  userId: string,
  rivals: List<string>,
  problem: Problem,
  submissions: Map<string, List<Submission>>
) => {
  const list = submissions.get(problem.id, List<Submission>());
  if (list.find(s => isAccepted(s.result) && s.user_id === userId)) {
    return "success";
  } else if (list.find(s => !isAccepted(s.result) && s.user_id in rivals)) {
    return "danger";
  } else if (list.find(s => !isAccepted(s.result) && s.user_id === userId)) {
    return "warning";
  } else {
    return "";
  }
};

interface Props {
  userId: string;
  rivals: List<string>;
  submissions: Map<string, List<Submission>>;
  contests: Map<string, Contest>;
  contestToProblems: Map<string, List<Problem>>;

  requestProblems: () => void;
  requestContest: () => void;
  requestContestProblemPairs: () => void;
}

interface TablePageState {
  showSolved: boolean;
}

class TablePage extends React.Component<Props, TablePageState> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showSolved: true
    };
  }

  componentDidMount() {
    this.props.requestProblems();
    this.props.requestContest();
    this.props.requestContestProblemPairs();
  }

  render() {
    const { showSolved } = this.state;
    const {
      userId,
      rivals,
      contests,
      contestToProblems,
      submissions
    } = this.props;

    const abc = contests.filter((v, k) => k.match(/^abc\d{3}$/));
    const arc = contests.filter((v, k) => k.match(/^arc\d{3}$/));
    const agc = contests.filter((v, k) => k.match(/^agc\d{3}$/));
    const others = contests.filter((v, k) => k.match(/^(?!a[rgb]c\d{3}).*$/));

    return (
      <div>
        <Row className="my-4">
          <FormGroup check>
            <Label check>
              <Input
                type="checkbox"
                checked={showSolved}
                onChange={() => this.setState({ showSolved: !showSolved })}
              />
              Show Accepted
            </Label>
          </FormGroup>
        </Row>
        <AtCoderRegularTable
          showSolved={showSolved}
          contests={abc}
          title="AtCoder Beginner Contest"
          contestToProblems={contestToProblems}
          getColor={problem =>
            getProblemStatusString(userId, rivals, problem, submissions)
          }
        />
        <AtCoderRegularTable
          showSolved={showSolved}
          contests={arc}
          title="AtCoder Regular Contest"
          contestToProblems={contestToProblems}
          getColor={problem =>
            getProblemStatusString(userId, rivals, problem, submissions)
          }
        />
        <AtCoderRegularTable
          showSolved={showSolved}
          contests={agc}
          title="AtCoder Grand Contest"
          contestToProblems={contestToProblems}
          getColor={problem =>
            getProblemStatusString(userId, rivals, problem, submissions)
          }
        />
        <Row className="my-4">
          <h2>Other Contests</h2>
        </Row>
        <ContestTable
          contests={others}
          contestToProblems={contestToProblems}
          showSolved={showSolved}
          getColor={problem =>
            getProblemStatusString(userId, rivals, problem, submissions)
          }
        />
      </div>
    );
  }
}

const ContestTable = (props: {
  contests: Map<string, Contest>;
  contestToProblems: Map<string, List<Problem>>;
  showSolved: boolean;
  getColor: (problem: Problem) => string;
}) => (
  <div>
    {props.contests
      .sort((a, b) => b.start_epoch_second - a.start_epoch_second)
      .map(contest => ({
        contest,
        problems: props.contestToProblems
          .get(contest.id, List<Problem>())
          .sort((a, b) => a.title.localeCompare(b.title))
      }))
      .filter(
        ({ contest, problems }) =>
          !props.showSolved ||
          !problems
            .map(p => props.getColor(p))
            .every(color => color === "success")
      )
      .map(({ contest, problems }) => {
        return (
          <div key={contest.id}>
            <strong>
              <a target="_blank" href={Url.formatContestUrl(contest.id)}>
                {contest.title}
              </a>
            </strong>
            <Table striped bordered hover responsive>
              <tbody>
                <tr>
                  {problems.map(p => (
                    <td key={p.id} className={props.getColor(p)}>
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
        );
      })}
  </div>
);

const AtCoderRegularTable = (props: {
  contests: Map<string, Contest>;
  contestToProblems: Map<string, List<Problem>>;
  getColor: (problem: Problem) => string;
  showSolved: boolean;
  title: string;
}) => {
  const { contestToProblems, showSolved } = props;
  const solvedAll = (contest: Contest) => {
    return contestToProblems
      .get(contest.id, List<Problem>())
      .every(problem => props.getColor(problem) === "success");
  };
  const contests = props.contests
    .valueSeq()
    .filter(contest => !showSolved || !solvedAll(contest))
    .sort((a, b) => b.start_epoch_second - a.start_epoch_second)
    .toArray();
  const maxProblemCount = contests.reduce(
    (currentCount, contest) =>
      Math.max(
        contestToProblems.get(contest.id, List<string>()).size,
        currentCount
      ),
    0
  );
  const header = ["A", "B", "C", "D", "E", "F", "F2"].slice(0, maxProblemCount);
  return (
    <Row className="my-4">
      <h2>{props.title}</h2>
      <BootstrapTable data={contests}>
        <TableHeaderColumn
          isKey
          dataField="id"
          columnClassName={(_: any, contest: Contest) =>
            contestToProblems
              .get(contest.id, List<Problem>())
              .every(problem => props.getColor(problem) === "success")
              ? "success"
              : ""
          }
          dataFormat={(_: any, contest: Contest) => (
            <a href={Url.formatContestUrl(contest.id)} target="_blank">
              {contest.id.toUpperCase()}
            </a>
          )}
        >
          Contest
        </TableHeaderColumn>
        {header.map((c, i) => (
          <TableHeaderColumn
            dataField={c}
            key={c}
            columnClassName={(_: any, contest: Contest) => {
              const problems = contestToProblems
                .get(contest.id, List<Problem>())
                .sort((a, b) => a.title.localeCompare(b.title));
              const problem = problems.get(i);
              return problem ? props.getColor(problem) : "";
            }}
            dataFormat={(_: any, contest: Contest) => {
              const problems = contestToProblems
                .get(contest.id, List<Problem>())
                .sort((a, b) => a.title.localeCompare(b.title));
              const problem = problems.get(i);
              return problem ? (
                <a
                  href={Url.formatProblemUrl(problem.id, contest.id)}
                  target="_blank"
                >
                  {problem.title}
                </a>
              ) : (
                ""
              );
            }}
          >
            {c}
          </TableHeaderColumn>
        ))}
      </BootstrapTable>
    </Row>
  );
};

const stateToProps = (state: State) => ({
  userId: state.users.userId,
  rivals: state.users.rivals,
  contestToProblems: state.contestToProblems.map(list =>
    list
      .map(id => state.problems.get(id))
      .reduce(
        (list, problem) => (problem ? list.push(problem) : list),
        List<Problem>()
      )
  ),
  contests: state.contests,
  submissions: state.submissions
});
const dispatchToProps = (dispatch: Dispatch) => ({
  requestContest: () => dispatch(requestContests()),
  requestProblems: () => dispatch(requestProblems()),
  requestContestProblemPairs: () => dispatch(requestContestProblemPair())
});

export default connect(
  stateToProps,
  dispatchToProps
)(TablePage);
