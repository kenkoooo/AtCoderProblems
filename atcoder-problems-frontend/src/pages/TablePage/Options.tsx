import React, { useState } from "react";
import {
  FormGroup,
  Input,
  Label,
  Container,
  Row,
  Col,
  Card,
  CardHeader,
  CardBody,
  Collapse
} from "reactstrap";
import HelpBadgeTooltip from "../../components/HelpBadgeTooltip";
import { Set } from "immutable";

interface Props {
  showAccepted: boolean;
  toggleShowAccepted: () => void;
  showDifficulties: boolean;
  toggleShowDifficulties: () => void;
  enableColorfulMode: boolean;
  toggleEnableColorfulMode: () => void;
  selectableLanguages: Set<string>;
  selectedLanguages: Set<string>;
  toggleLanguage: (language: string) => void;
}

const Options: React.FC<Props> = props => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Container>
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
      {props.selectableLanguages.isEmpty() || (
        <Row className="my-4">
          <Col className="px-0">
            <Card>
              <CardHeader
                className="dropdown-toggle"
                onClick={() => setIsOpen(!isOpen)}
              >
                Languages
              </CardHeader>
              <Collapse isOpen={isOpen}>
                <CardBody>
                  <FormGroup check className="m-0 p-0">
                    {props.selectableLanguages
                      .toArray()
                      .sort()
                      .map(language => (
                        <Label
                          check
                          key={language}
                          style={{ marginLeft: "2rem" }}
                        >
                          <Input
                            type="checkbox"
                            checked={props.selectedLanguages.has(language)}
                            onChange={() => props.toggleLanguage(language)}
                          />
                          {language}
                        </Label>
                      ))}
                  </FormGroup>
                </CardBody>
              </Collapse>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Options;
