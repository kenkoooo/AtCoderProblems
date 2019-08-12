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

type StatusLabel = "success" | "danger" | "warning" | "";
const getProblemStatusString = (
  userId: string,
  rivals: List<string>,
  problem: Problem,
  submissions: Map<string, List<Submission>>
): StatusLabel => {
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
  problemLabels: Map<string, StatusLabel>;

  requestData: () => void;
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
    this.props.requestData();
  }

  render() {
    const { showSolved } = this.state;
    const {
      userId,
      rivals,
      contests,
      contestToProblems,
      submissions,
      problemLabels
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
          problemLabels={problemLabels}
        />
        <AtCoderRegularTable
          showSolved={showSolved}
          contests={arc}
          title="AtCoder Regular Contest"
          contestToProblems={contestToProblems}
          problemLabels={problemLabels}
        />
        <AtCoderRegularTable
          showSolved={showSolved}
          contests={agc}
          title="AtCoder Grand Contest"
          contestToProblems={contestToProblems}
          problemLabels={problemLabels}
        />
        <Row className="my-4">
          <h2>Other Contests</h2>
        </Row>
        <ContestTable
          contests={others}
          contestToProblems={contestToProblems}
          showSolved={showSolved}
          submissions={submissions}
          userId={userId}
          rivals={rivals}
          problemLabels={problemLabels}
        />
      </div>
    );
  }
}

const ContestTable = (props: {
  contests: Map<string, Contest>;
  contestToProblems: Map<string, List<Problem>>;
  showSolved: boolean;
  submissions: Map<string, List<Submission>>;
  userId: string;
  rivals: List<string>;
  problemLabels: Map<string, StatusLabel>;
}) => (
  <div>
    {props.contests
      .valueSeq()
      .sort((a, b) => b.start_epoch_second - a.start_epoch_second)
      .map(contest => ({
        contest,
        problems: props.contestToProblems
          .get(contest.id, List<Problem>())
          .sort((a, b) => a.title.localeCompare(b.title))
      }))
      .filter(
        ({ contest, problems }) =>
          props.showSolved ||
          !problems
            .map(p => props.problemLabels.get(p.id, ""))
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
                    <td
                      key={p.id}
                      className={props.problemLabels.get(p.id, "")}
                    >
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
      })
      .toArray()}
  </div>
);

const AtCoderRegularTable = (props: {
  contests: Map<string, Contest>;
  contestToProblems: Map<string, List<Problem>>;
  showSolved: boolean;
  title: string;
  problemLabels: Map<string, StatusLabel>;
}) => {
  const { contestToProblems, showSolved, problemLabels } = props;
  const solvedAll = (contest: Contest) => {
    return contestToProblems
      .get(contest.id, List<Problem>())
      .every(p => problemLabels.get(p.id, "") === "success");
  };
  const ithProblem = (contest: Contest, i: number) =>
    contestToProblems
      .get(contest.id, List<Problem>())
      .sort((a, b) => a.title.localeCompare(b.title))
      .get(i);
  const contests = props.contests
    .valueSeq()
    .filter(contest => showSolved || !solvedAll(contest))
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
              .every(p => problemLabels.get(p.id) === "success")
              ? "table-success"
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
              const problem = ithProblem(contest, i);
              return problem
                ? "table-" + problemLabels.get(problem.id, "")
                : "";
            }}
            dataFormat={(_: any, contest: Contest) => {
              const problem = ithProblem(contest, i);
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
      .filter(
        (problem: Problem | undefined): problem is Problem =>
          problem !== undefined
      )
  ),
  contests: state.contests,
  submissions: state.submissions,
  problemLabels: state.problems.map(p =>
    getProblemStatusString(
      state.users.userId,
      state.users.rivals,
      p,
      state.submissions
    )
  )
});
const dispatchToProps = (dispatch: Dispatch) => ({
  requestData: () => {
    dispatch(requestContests());
    dispatch(requestProblems());
    dispatch(requestContestProblemPair());
  }
});

export default connect(
  stateToProps,
  dispatchToProps
)(TablePage);
