import React from "react";
import { FormGroup, Input, Label, Row, ButtonGroup, Button } from "reactstrap";
import {Dispatch} from "redux";
import { connect } from "react-redux";
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
import {updateShowDifficulty} from "../../actions";
import HelpBadgeTooltip from "../../components/HelpBadgeTooltip";
import {TableHeaderColumn} from "react-bootstrap-table";

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

interface CheckBoxShowDifficultyProps {
  showDifficulty: boolean;
  toggle: (showDifficulty: boolean)=>void;
}

const CheckBoxShowDifficulty: React.FC<CheckBoxShowDifficultyProps> = props => {
  const {showDifficulty, toggle} = props;
  return (
    <FormGroup check inline>
      <Label check>
        <Input
          type="checkbox"
          checked={showDifficulty}
          onChange={() => toggle(!showDifficulty)}
        />
        Show Difficulty
        <HelpBadgeTooltip id="difficulty">
          Internal rating to have 50% Solve Probability
        </HelpBadgeTooltip>
      </Label>
    </FormGroup>
  );
};

const CheckBoxShowDifficultyConnected = connect(
  (state: State) => ({
    showDifficulty: state.showDifficulty
  }),
  (dispatch: Dispatch) => ({
    toggle: (showDifficulty: boolean) => dispatch(updateShowDifficulty(showDifficulty))
  })
)(CheckBoxShowDifficulty);

interface Props {
  userId: string;
  rivals: List<string>;
  submissions: Map<ProblemId, List<Submission>>;
  contests: Map<ContestId, Contest>;
  contestToProblems: Map<ContestId, List<Problem>>;
  statusLabelMap: Map<ProblemId, ProblemStatus>;
}

interface LocalState {
  showSolved: boolean;
}

class TablePage extends React.Component<Props, LocalState> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showSolved: true,
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
      statusLabelMap,
    } = this.props;

    const abc = contests.filter((v, k) => k.match(/^abc\d{3}$/));
    const arc = contests.filter((v, k) => k.match(/^arc\d{3}$/));
    const agc = contests.filter((v, k) => k.match(/^agc\d{3}$/));
    let ratedContests = new Set();
    abc.forEach((v, k) => ratedContests.add(k));
    arc.forEach((v, k) => ratedContests.add(k));
    agc.forEach((v, k) => ratedContests.add(k));
    const othersRated = contests
      .filter((v,k) => !ratedContests.has(k) )
      .filter((v,k) => v.rate_change !== "-" )
      .filter((v,k) => v.start_epoch_second >= 1468670400); // agc001
    othersRated.forEach((v, k) => ratedContests.add(k));
    const others = contests.filter((v,k) => !ratedContests.has(k) );

    return (
      <div>
        <Row className="my-4">
          <FormGroup check inline>
            <Label check>
              <Input
                type="checkbox"
                checked={showSolved}
                onChange={() => this.setState({ showSolved: !showSolved })}
              />
              Show Accepted
            </Label>
          </FormGroup>
          <CheckBoxShowDifficultyConnected />
        </Row>
        <Row>
          <ButtonGroup>
            <Button color="secondary" onClick={
              ()=> {
                const e = Array.from(document.querySelectorAll('h2')).find(e => e.textContent === "AtCoder Beginner Contest");
                if(e) e.scrollIntoView({behavior: "smooth", block: "center"});
              }
            }>
              ABC
            </Button>
            <Button color="secondary" onClick={
              ()=> {
                const e = Array.from(document.querySelectorAll('h2')).find(e => e.textContent === "AtCoder Regular Contest");
                if(e) e.scrollIntoView({behavior: "smooth", block: "center"});
              }
            }>
              ARC
            </Button>
            <Button color="secondary" onClick={
              ()=> {
                const e = Array.from(document.querySelectorAll('h2')).find(e => e.textContent === "AtCoder Grand Contest");
                if(e) e.scrollIntoView({behavior: "smooth", block: "center"});
              }
            }>
              AGC
            </Button>
            <Button color="secondary" onClick={
              ()=> {
                const e = Array.from(document.querySelectorAll('h2')).find(e => e.textContent === "Other Rated Contests");
                if(e) e.scrollIntoView({behavior: "smooth", block: "center"});
              }
            }>
              Other Rated Contests
            </Button>
            <Button color="secondary" onClick={
              ()=> {
                const e = Array.from(document.querySelectorAll('h2')).find(e => e.textContent === "Other Contests");
                if(e) e.scrollIntoView({behavior: "smooth", block: "center"});
              }
            }>
              Other Contests
            </Button>
          </ButtonGroup>
        </Row>
        <AtCoderRegularTable
          showSolved={showSolved}
          contests={abc}
          title="AtCoder Beginner Contest"
          contestToProblems={contestToProblems}
          statusLabelMap={statusLabelMap}
        />
        <AtCoderRegularTable
          showSolved={showSolved}
          contests={arc}
          title="AtCoder Regular Contest"
          contestToProblems={contestToProblems}
          statusLabelMap={statusLabelMap}
        />
        <AtCoderRegularTable
          showSolved={showSolved}
          contests={agc}
          title="AtCoder Grand Contest"
          contestToProblems={contestToProblems}
          statusLabelMap={statusLabelMap}
        />
        <Row className="my-4">
          <h2>Other Rated Contests</h2>
        </Row>
        <ContestTable
          contests={othersRated}
          contestToProblems={contestToProblems}
          showSolved={showSolved}
          submissions={submissions}
          userId={userId}
          rivals={rivals}
          statusLabelMap={statusLabelMap}
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
});

export default connect(
  stateToProps
)(TablePage);
