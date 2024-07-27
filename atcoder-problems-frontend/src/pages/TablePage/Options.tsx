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
import { HelpBadgeTooltip } from "../../components/HelpBadgeTooltip";
import { ColorMode } from "../../utils/TableColor";
import { ShowDifficultyMode } from "../../utils/ShowDifficultyMode";

interface Props {
  hideCompletedContest: boolean;
  toggleHideCompletedContest: () => void;
  showDifficultyMode: ShowDifficultyMode;
  setShowDifficultyMode: (showDifficultyMode: ShowDifficultyMode) => void;
  colorMode: ColorMode;
  setColorMode: (colorMode: ColorMode) => void;
  showPenalties: boolean;
  toggleShowPenalties: () => void;
  selectableLanguages: Set<string>;
  selectedLanguages: Set<string>;
  toggleLanguage: (language: string) => void;
  mergeLikeContest: boolean;
  setMergeLikeContest: (mergeLikeContest: boolean) => void;
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
              label="Hide Completed Contests"
              checked={props.hideCompletedContest}
              onChange={props.toggleHideCompletedContest}
            />
          </Label>
        </FormGroup>
        <UncontrolledDropdown>
          <DropdownToggle caret>
            {
              {
                [ShowDifficultyMode.None]: "None",
                [ShowDifficultyMode.Full]: "Full",
                [ShowDifficultyMode.Sub]: "Sub",
              }[props.showDifficultyMode]
            }
          </DropdownToggle>
          <DropdownMenu>
            <DropdownItem header>Show Difficulty Mode</DropdownItem>
            <DropdownItem
              onClick={(): void =>
                props.setShowDifficultyMode(ShowDifficultyMode.None)
              }
            >
              None
            </DropdownItem>
            <DropdownItem
              onClick={(): void =>
                props.setShowDifficultyMode(ShowDifficultyMode.Full)
              }
            >
              Full
            </DropdownItem>
            <DropdownItem
              onClick={(): void =>
                props.setShowDifficultyMode(ShowDifficultyMode.Sub)
              }
            >
              Sub
            </DropdownItem>
          </DropdownMenu>
        </UncontrolledDropdown>
        <FormGroup check inline>
          &nbsp; Show Difficulty &nbsp;
          <HelpBadgeTooltip id="difficulty">
            Internal rating to have 50% Solve Probability
          </HelpBadgeTooltip>
        </FormGroup>
        <FormGroup check inline class="my-4">
          <Label check>
            <CustomInput
              type="switch"
              id="mergeLikeContest"
              label='Merge "-Like" Contests'
              checked={props.mergeLikeContest}
              onChange={() => {
                props.setMergeLikeContest(!props.mergeLikeContest);
              }}
            />
          </Label>
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
        props.selectableLanguages.size > 0 && (
          <Row className="my-4">
            <Col className="px-0">
              <Card body>
                <FormGroup check className="m-0 p-0">
                  {Array.from(props.selectableLanguages)
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
