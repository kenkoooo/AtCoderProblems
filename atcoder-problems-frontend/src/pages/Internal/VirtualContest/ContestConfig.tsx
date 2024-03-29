import React, { useState } from "react";
import {
  Button,
  Col,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  FormFeedback,
  Input,
  InputGroup,
  Label,
  Row,
  UncontrolledDropdown,
} from "reactstrap";
import { List, Range } from "immutable";
import moment from "moment";
import { Redirect } from "react-router";
import { useProblemModelMap, useProblems } from "../../../api/APIClient";
import { useLoginState } from "../../../api/InternalAPIClient";
import Problem from "../../../interfaces/Problem";
import { ProblemSearchBox } from "../../../components/ProblemSearchBox";
import {
  formatMode,
  VirtualContestItem,
  VirtualContestMode,
  formatPublicState,
} from "../types";
import { ProblemSetGenerator } from "../../../components/ProblemSetGenerator";
import { HelpBadgeTooltip } from "../../../components/HelpBadgeTooltip";
import { HelpBadgeModal } from "../../../components/HelpBadgeModal";
import { DraggableContestConfigProblemTable } from "./DraggableContestConfigProblemTable";

const toUnixSecond = (date: string, hour: number, minute: number): number => {
  const hh = hour < 10 ? `0${hour}` : hour.toString();
  const mm = minute < 10 ? `0${minute}` : minute.toString();
  const s = `${date}T${hh}:${mm}:00`;
  return moment(s).unix();
};

export const ContestConfig: React.FC<Props> = (props) => {
  const loginState = useLoginState();
  const [title, setTitle] = useState(props.initialTitle);
  const [memo, setMemo] = useState(props.initialMemo);

  const [startDate, setStartDate] = useState(props.initialStartDate);
  const [startHour, setStartHour] = useState(props.initialStartHour);
  const [startMinute, setStartMinute] = useState(props.initialStartMinute);
  const [endDate, setEndDate] = useState(props.initialEndDate);
  const [endHour, setEndHour] = useState(props.initialEndHour);
  const [endMinute, setEndMinute] = useState(props.initialEndMinute);
  const [problemSet, setProblemSet] = useState(props.initialProblems.toArray());
  const [mode, setMode] = useState(props.initialMode);
  const [publicState, setPublicState] = useState(props.initialPublicState);
  const [penaltySecond, setPenaltySecond] = useState(
    props.initialPenaltySecond
  );
  const [
    expectedParticipantUserIdsText,
    setExpectedParticipantUserIdsText,
  ] = useState("");
  const [
    expectedParticipantsInputErrorMessage,
    setExpectedParticipantsInputErrorMessage,
  ] = useState("");
  const hasExpectedParticipantsInputError =
    expectedParticipantsInputErrorMessage.length > 0;

  const expectedParticipantUserIds =
    expectedParticipantUserIdsText.length > 0
      ? expectedParticipantUserIdsText.split(" ")
      : [];

  const problems = useProblems();
  const problemModels = useProblemModelMap();

  if (loginState.error) {
    return <Redirect to="/" />;
  }

  if (!problems || !problemModels) {
    return null;
  }

  const startSecond = toUnixSecond(startDate, startHour, startMinute);
  const endSecond = toUnixSecond(endDate, endHour, endMinute);
  const isValid = title.length > 0 && startSecond <= endSecond;

  const addProblemsIfNotSelected = (...problems: Problem[]): void => {
    const newProblemSet = [...problemSet];
    problems.forEach((problem) => {
      if (problemSet.every((p) => p.id !== problem.id)) {
        newProblemSet.push({
          id: problem.id,
          point: null,
          order: null,
        });
      }
    });
    setProblemSet(newProblemSet);
  };

  return (
    <>
      <Row>
        <Col>
          <h1>{props.pageTitle}</h1>
        </Col>
      </Row>

      <h2 className="my-3">Contest Information</h2>

      <Row className="my-2">
        <Col>
          <Label>Contest Title</Label>
          <Input
            type="text"
            placeholder="Contest Title"
            value={title}
            onChange={(event): void => setTitle(event.target.value)}
          />
        </Col>
      </Row>

      <Row className="my-2">
        <Col>
          <Label>Description</Label>
          <Input
            type="textarea"
            placeholder="Description"
            value={memo}
            onChange={(event): void => setMemo(event.target.value)}
          />
        </Col>
      </Row>

      <Row className="my-2">
        <Col>
          <Label>Public State</Label>
          <InputGroup>
            <UncontrolledDropdown>
              <DropdownToggle caret>
                {formatPublicState(publicState)}
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem onClick={(): void => setPublicState(true)}>
                  {formatPublicState(true)}
                </DropdownItem>
                <DropdownItem onClick={(): void => setPublicState(false)}>
                  {formatPublicState(false)}
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
          </InputGroup>
        </Col>
      </Row>

      <Row className="my-2">
        <Col>
          <Label>
            Mode{" "}
            <HelpBadgeModal
              title="Explanation of Different Modes"
              id="help-virtual-contest-modes"
            >
              <p>
                <b>Normal:</b> similar to normal contests. Contestants are
                ranked by total score, then penalty.
              </p>
              <p>
                <b>Lockout:</b> only the first contestant who solved the problem
                gets the score for the problem.
              </p>
              <p>
                <b>Training:</b> contestants are ranked by total number of
                solved problems, then time of last accepted submission.
              </p>
            </HelpBadgeModal>
          </Label>
          <InputGroup>
            <UncontrolledDropdown>
              <DropdownToggle caret>{formatMode(mode)}</DropdownToggle>
              <DropdownMenu>
                <DropdownItem onClick={(): void => setMode(null)}>
                  {formatMode(null)}
                </DropdownItem>
                <DropdownItem onClick={(): void => setMode("lockout")}>
                  {formatMode("lockout")}
                </DropdownItem>
                <DropdownItem onClick={(): void => setMode("training")}>
                  {formatMode("training")}
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
          </InputGroup>
        </Col>
      </Row>

      <Row className="my-2">
        <Col>
          <Label>Penalty (seconds)</Label>
          <Input
            type="number"
            placeholder="Penalty for each wrong submission in seconds"
            defaultValue={penaltySecond}
            onChange={(event): void =>
              setPenaltySecond(event.target.valueAsNumber)
            }
          />
        </Col>
      </Row>

      <Row className="my-2">
        <Col>
          <Label>Start Time</Label>
          <InputGroup>
            <Input
              type="date"
              value={startDate}
              onChange={(event): void => setStartDate(event.target.value)}
            />
            <Input
              type="select"
              value={startHour}
              onChange={(e): void => setStartHour(Number(e.target.value))}
            >
              {Range(0, 24).map((i) => (
                <option key={i} value={i}>
                  {i.toFixed().padStart(2, "0")}
                </option>
              ))}
            </Input>
            <Input
              type="select"
              value={startMinute}
              onChange={(e): void => setStartMinute(Number(e.target.value))}
            >
              {Range(0, 60, 5).map((i) => (
                <option key={i} value={i}>
                  {i.toFixed().padStart(2, "0")}
                </option>
              ))}
            </Input>
          </InputGroup>
        </Col>
      </Row>

      <Row className="my-2">
        <Col>
          <Label>End Time</Label>
          <InputGroup>
            <Input
              type="date"
              value={endDate}
              onChange={(event): void => setEndDate(event.target.value)}
            />
            <Input
              type="select"
              value={endHour}
              onChange={(e): void => setEndHour(Number(e.target.value))}
            >
              {Range(0, 24).map((i) => (
                <option key={i} value={i}>
                  {i.toFixed().padStart(2, "0")}
                </option>
              ))}
            </Input>
            <Input
              type="select"
              value={endMinute}
              onChange={(e): void => setEndMinute(Number(e.target.value))}
            >
              {Range(0, 60, 5).map((i) => (
                <option key={i} value={i}>
                  {i.toFixed().padStart(2, "0")}
                </option>
              ))}
            </Input>
          </InputGroup>
        </Col>
      </Row>

      <Row className="my-2">
        <Col>
          <Label>
            Expected Participants{" "}
            <HelpBadgeTooltip id={"help-expected-participants"}>
              This list is used for checking if the problems in the list are
              already solved by each participant.
            </HelpBadgeTooltip>
          </Label>
          <Input
            placeholder="AtCoder ID list separated by space"
            value={expectedParticipantUserIdsText}
            invalid={hasExpectedParticipantsInputError}
            onChange={(event): void => {
              setExpectedParticipantUserIdsText(event.target.value);
            }}
          />
          {hasExpectedParticipantsInputError && (
            <FormFeedback>{expectedParticipantsInputErrorMessage}</FormFeedback>
          )}
        </Col>
      </Row>

      <h2 className="my-3">Contest Problemset</h2>

      <Row className="my-2">
        <Col>
          <DraggableContestConfigProblemTable
            onSolvedProblemsFetchFinished={(errorMessage): void => {
              setExpectedParticipantsInputErrorMessage(errorMessage || "");
            }}
            problemSet={problemSet}
            setProblemSet={setProblemSet}
            expectedParticipantUserIds={expectedParticipantUserIds}
          />
        </Col>
      </Row>

      <Row className="my-2">
        <Col>
          <ProblemSearchBox
            problems={problems}
            selectProblem={addProblemsIfNotSelected}
          />
        </Col>
      </Row>

      <h2 className="my-3">
        Bacha Gacha{" "}
        <HelpBadgeTooltip id={"help-bacha-gacha"}>
          This is a feature that helps you generate problems by picking problems
          within certain ranges of difficulties, which is then appended to your
          problemset.
        </HelpBadgeTooltip>
      </h2>

      <Row>
        <Col>
          <div style={{ padding: 8, border: "solid 1px lightgray" }}>
            <Label>Options</Label>

            <Row className="my-2">
              <Col>
                <ProblemSetGenerator
                  selectProblem={addProblemsIfNotSelected}
                  expectedParticipantUserIds={expectedParticipantUserIds}
                  addButtonDisabled={hasExpectedParticipantsInputError}
                  feedbackForDisabledAddButton={
                    expectedParticipantsInputErrorMessage &&
                    "Please fix expected participants field first"
                  }
                />
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      <Row className="my-2">
        <Col>
          <Button
            disabled={!isValid}
            color={isValid ? "success" : "link"}
            onClick={(): void =>
              props.buttonPush({
                title,
                memo,
                startSecond,
                endSecond,
                problems: List(problemSet),
                mode,
                publicState,
                penaltySecond,
              })
            }
          >
            {props.buttonTitle}
          </Button>
        </Col>
      </Row>
    </>
  );
};

interface ContestInfo {
  title: string;
  memo: string;
  startSecond: number;
  endSecond: number;
  mode: VirtualContestMode;
  publicState: boolean;
  penaltySecond: number;
  problems: List<VirtualContestItem>;
}

interface Props {
  initialProblems: List<VirtualContestItem>;
  pageTitle: string;
  initialTitle: string;
  initialMemo: string;
  initialStartDate: string;
  initialStartHour: number;
  initialStartMinute: number;
  initialEndDate: string;
  initialEndHour: number;
  initialEndMinute: number;
  initialMode: VirtualContestMode;
  initialPublicState: boolean;
  initialPenaltySecond: number;

  buttonPush: (contest: ContestInfo) => void;
  buttonTitle: string;
}
