import React from "react";
import { FormGroup, Input, Label, Row} from "reactstrap";
import {Dispatch} from "redux";
import { connect } from "react-redux";
import State from "../../interfaces/State";
import {updateShowAccepted, updateShowDifficulty} from "../../actions";
import HelpBadgeTooltip from "../../components/HelpBadgeTooltip";

interface ShowDifficultyProps {
  showDifficulty: boolean;
  toggle: (showDifficulty: boolean)=>void;
}

const ShowDifficulty: React.FC<ShowDifficultyProps> = props => {
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

const ShowDifficultyConnected = connect(
  (state: State) => ({
    showDifficulty: state.showDifficulty
  }),
  (dispatch: Dispatch) => ({
    toggle: (showDifficulty: boolean) => dispatch(updateShowDifficulty(showDifficulty))
  })
)(ShowDifficulty);

interface ShowAcceptedProps {
  showAccepted: boolean;
  toggle: (showAccepted: boolean)=>void;
}

const ShowAccepted: React.FC<ShowAcceptedProps> = props => {
  const {showAccepted, toggle} = props;
  return (
    <FormGroup check inline>
      <Label check>
        <Input
          type="checkbox"
          checked={showAccepted}
          onChange={() => toggle(!showAccepted)}
        />
        Show Accepted
      </Label>
    </FormGroup>
  );
}

const ShowAcceptedConnected = connect(
  (state: State) => ({
    showAccepted: state.showAccepted
  }),
  (dispatch: Dispatch) => ({
    toggle: (showAccepted: boolean) => dispatch(updateShowAccepted(showAccepted))
  })
)(ShowAccepted);

const Options: React.FC<{}> = () => {
  return (
    <Row className="my-4">
      <ShowAcceptedConnected />
      <ShowDifficultyConnected />
    </Row>
  );
}

export default Options;
