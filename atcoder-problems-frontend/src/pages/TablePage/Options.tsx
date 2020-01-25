import React from "react";
import { FormGroup, Input, Label, Row } from "reactstrap";
import HelpBadgeTooltip from "../../components/HelpBadgeTooltip";

interface Props {
  showAccepted: boolean;
  toggleShowAccepted: () => void;
  showDifficulties: boolean;
  toggleShowDifficulties: () => void;
  enableColorfulMode: boolean;
  toggleEnableColorfulMode: () => void;
}

const Options: React.FC<Props> = props => {
  return (
    <Row className="my-4">
      <FormGroup check inline>
        <Label check>
          <Input
            type="checkbox"
            checked={props.showAccepted}
            onChange={props.toggleShowAccepted}
          />
          Show Accepted
        </Label>
      </FormGroup>
      <FormGroup check inline>
        <Label check>
          <Input
            type="checkbox"
            checked={props.showDifficulties}
            onChange={props.toggleShowDifficulties}
          />
          Show Difficulty
          <HelpBadgeTooltip id="difficulty">
            Internal rating to have 50% Solve Probability
          </HelpBadgeTooltip>
        </Label>
      </FormGroup>
      <FormGroup check inline>
        <Label check>
          <Input
            type="checkbox"
            checked={props.enableColorfulMode}
            onChange={props.toggleEnableColorfulMode}
          />
          Colorful Mode
        </Label>
      </FormGroup>
    </Row>
  );
};

export default Options;
