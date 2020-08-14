import React from "react";
import {
  CustomInput,
  FormGroup,
  Input,
  Label,
  Row,
  Col,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Card,
} from "reactstrap";
import { Set } from "immutable";
import { HelpBadgeTooltip } from "../../components/HelpBadgeTooltip";
import { ColorMode } from "../../utils/TableColor";

interface Props {
  hideCompletedContest: boolean;
  toggleHideCompletedContest: () => void;
  showDifficulties: boolean;
  toggleShowDifficulties: () => void;
  colorMode: ColorMode;
  setColorMode: (colorMode: ColorMode) => void;
  showPenalties: boolean;
  toggleShowPenalties: () => void;
  selectableLanguages: Set<string>;
  selectedLanguages: Set<string>;
  toggleLanguage: (language: string) => void;
}

export const Options: React.FC<Props> = (props) => {
  return (
    <>
      <Row className="my-4">
        <FormGroup check inline>
          <Label check>
            <CustomInput
              type="switch"
              id="hideCompletedContest"
              label="Hide Completed Contest"
              checked={props.hideCompletedContest}
              onChange={props.toggleHideCompletedContest}
            />
          </Label>
        </FormGroup>
        <FormGroup check inline>
          <Label check>
            <CustomInput
              type="switch"
              id="showDifficulties"
              label="Show Difficulty"
              checked={props.showDifficulties}
              onChange={props.toggleShowDifficulties}
            />
          </Label>
          &nbsp;
          <HelpBadgeTooltip id="difficulty">
            Internal rating to have 50% Solve Probability
          </HelpBadgeTooltip>
        </FormGroup>
        {props.colorMode === ColorMode.ContestResult && (
          <FormGroup check inline>
            <Label check>
              <CustomInput
                type="switch"
                id="showPenalties"
                label="Show Penalties"
                checked={props.showPenalties}
                onChange={props.toggleShowPenalties}
              />
            </Label>
          </FormGroup>
        )}
        <UncontrolledDropdown>
          <DropdownToggle caret>
            {
              {
                [ColorMode.None]: "Color By",
                [ColorMode.ContestResult]: "Contest Result",
                [ColorMode.Language]: "Language",
              }[props.colorMode]
            }
          </DropdownToggle>
          <DropdownMenu>
            <DropdownItem header>Color By</DropdownItem>
            <DropdownItem
              onClick={(): void => props.setColorMode(ColorMode.None)}
            >
              None
            </DropdownItem>
            <DropdownItem
              onClick={(): void => props.setColorMode(ColorMode.ContestResult)}
            >
              Contest Result
            </DropdownItem>
            <DropdownItem
              onClick={(): void => props.setColorMode(ColorMode.Language)}
            >
              Language
            </DropdownItem>
          </DropdownMenu>
        </UncontrolledDropdown>
      </Row>
      {props.colorMode === ColorMode.Language &&
        !props.selectableLanguages.isEmpty() && (
          <Row className="my-4">
            <Col className="px-0">
              <Card body>
                <FormGroup check className="m-0 p-0">
                  {props.selectableLanguages
                    .toArray()
                    .sort()
                    .map((language) => (
                      <Label
                        check
                        key={language}
                        style={{ marginLeft: "2rem" }}
                      >
                        <Input
                          type="checkbox"
                          checked={props.selectedLanguages.has(language)}
                          onChange={(): void => props.toggleLanguage(language)}
                        />
                        {language}
                      </Label>
                    ))}
                </FormGroup>
              </Card>
            </Col>
          </Row>
        )}
    </>
  );
};
