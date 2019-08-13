import React from "react";
import { FormGroup, Input, Label, Row } from "reactstrap";
import { isAccepted } from "../../utils";
import { connect } from "react-redux";
import Contest from "../../interfaces/Contest";
import Problem from "../../interfaces/Problem";
import State from "../../interfaces/State";
import { List, Map } from "immutable";
import Submission from "../../interfaces/Submission";
import ContestTable from "./ContestTable";
import { AtCoderRegularTable } from "./AtCoderRegularTable";

export type StatusLabel = "success" | "danger" | "warning" | "";

const getProblemStatusString = (
  userId: string,
  rivals: List<string>,
  problem: Problem,
  submissions: Map<string, List<Submission>>
): StatusLabel => {
  const list = submissions.get(problem.id, List<Submission>());
  if (list.find(s => isAccepted(s.result) && s.user_id === userId)) {
    return "success";
  } else if (
    list.find(s => isAccepted(s.result) && rivals.contains(s.user_id))
  ) {
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
}

interface LocalState {
  showSolved: boolean;
}

class TablePage extends React.Component<Props, LocalState> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showSolved: true
    };
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

export default connect(stateToProps)(TablePage);
