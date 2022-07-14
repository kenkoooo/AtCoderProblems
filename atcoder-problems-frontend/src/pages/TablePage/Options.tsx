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
import { ContestCategory } from "../../utils/ContestClassifier";
import { getLikeContest } from "../../utils/LikeContestUtils";

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
  active: ContestCategory;
  setSelectedContests: (contest: ContestCategory[]) => void;
  showableShowLikeContest: boolean;
  showLikeContest: boolean;
  setShowLikeContest: (showLikeContest: boolean) => void;
}

export const Options: React.FC<Props> = (props) => {
  const changeShowLikeContest = (checked: boolean) => {
    const likeContest = getLikeContest(props.active);
    if (checked && likeContest) {
      props.setSelectedContests([props.active, likeContest]);
    } else {
      props.setSelectedContests([props.active]);
    }
  };
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
        {props.showableShowLikeContest && (
          <FormGroup check inline class="my-4">
            <Label check>
              <CustomInput
                type="switch"
                id="showLikeContest"
                label="Show Like Contest"
                checked={props.showLikeContest}
                onChange={(e) => {
                  changeShowLikeContest(e.target.checked);
                  props.setShowLikeContest(!props.showLikeContest);
                }}
              />
            </Label>
          </FormGroup>
        )}
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
