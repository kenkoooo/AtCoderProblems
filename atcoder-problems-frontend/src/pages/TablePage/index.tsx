import React from "react";
import { FormGroup, Input, Label, Row } from "reactstrap";
import { connect } from "react-redux";
import {Dispatch} from "redux";
import Contest from "../../interfaces/Contest";
import Problem from "../../interfaces/Problem";
import State, {
  ContestId,
  ProblemId,
  ProblemStatus,
  StatusLabel
} from "../../interfaces/State";
import { List, Map } from "immutable";
import Submission from "../../interfaces/Submission";
import ProblemModel from "../../interfaces/ProblemModel";
import ContestTable from "./ContestTable";
import { AtCoderRegularTable } from "./AtCoderRegularTable";
import {requestProblemModels} from "../../actions";

export const statusLabelToTableColor = (label: StatusLabel) => {
  switch (label) {
    case StatusLabel.Success:
      return "table-success";
    case StatusLabel.Failed:
      return "table-danger";
    case StatusLabel.Warning:
      return "table-warning";
    case StatusLabel.None:
      return "";
    default:
      return "";
  }
};

interface Props {
  userId: string;
  rivals: List<string>;
  submissions: Map<ProblemId, List<Submission>>;
  contests: Map<ContestId, Contest>;
  contestToProblems: Map<ContestId, List<Problem>>;
  statusLabelMap: Map<ProblemId, ProblemStatus>;
  problemModels: Map<string, ProblemModel>;

  requestData: () => void;
}

interface LocalState {
  showSolved: boolean;
  showDifficulty: boolean;
}

class TablePage extends React.Component<Props, LocalState> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showSolved: true,
      showDifficulty: false
    };
  }

  componentDidMount() {
    this.props.requestData();
  }

  render() {
    const { showSolved, showDifficulty } = this.state;
    const {
      userId,
      rivals,
      contests,
      contestToProblems,
      submissions,
      statusLabelMap,
      problemModels
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
          <FormGroup check>
            <Label check>
              <Input
                type="checkbox"
                checked={showDifficulty}
                onChange={() => this.setState({ showDifficulty: !showDifficulty })}
              />
              Show Difficulty
            </Label>
          </FormGroup>
        </Row>
        <AtCoderRegularTable
          showSolved={showSolved}
          showDifficulty={showDifficulty}
          contests={abc}
          title="AtCoder Beginner Contest"
          contestToProblems={contestToProblems}
          statusLabelMap={statusLabelMap}
          problemModels={problemModels}
        />
        <AtCoderRegularTable
          showSolved={showSolved}
          showDifficulty={showDifficulty}
          contests={arc}
          title="AtCoder Regular Contest"
          contestToProblems={contestToProblems}
          statusLabelMap={statusLabelMap}
          problemModels={problemModels}
        />
        <AtCoderRegularTable
          showSolved={showSolved}
          showDifficulty={showDifficulty}
          contests={agc}
          title="AtCoder Grand Contest"
          contestToProblems={contestToProblems}
          statusLabelMap={statusLabelMap}
          problemModels={problemModels}
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
          statusLabelMap={statusLabelMap}
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
  statusLabelMap: state.cache.statusLabelMap,
  problemModels: state.problemModels
});

const dispatchToProps = (dispatch: Dispatch) => ({
  requestData: () => {
    dispatch(requestProblemModels());
  }
});

export default connect(
  stateToProps,
  dispatchToProps
)(TablePage);
