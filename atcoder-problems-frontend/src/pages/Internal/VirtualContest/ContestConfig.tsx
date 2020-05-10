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
  UncontrolledDropdown
} from "reactstrap";
import { List, Map, Range } from "immutable";
import { connect, PromiseState } from "react-refetch";
import * as CachedApiClient from "../../../utils/CachedApiClient";
import { ProblemId } from "../../../interfaces/Status";
import Problem from "../../../interfaces/Problem";
import moment from "moment";
import { USER_GET } from "../ApiUrl";
import { ProblemSearchBox } from "../../../components/ProblemSearchBox";
import { formatMode, VirtualContestItem, VirtualContestMode } from "../types";
import ProblemModel from "../../../interfaces/ProblemModel";
import ProblemSetGenerator from "../../../components/ProblemSetGenerator";
import HelpBadgeTooltip from "../../../components/HelpBadgeTooltip";
import { Redirect } from "react-router";
import ContestConfigProblemList from "./ContestConfigProblemList";

const ContestConfig = (props: InnerProps) => {
  const [title, setTitle] = useState(props.initialTitle);
  const [memo, setMemo] = useState(props.initialMemo);

  const [startDate, setStartDate] = useState(props.initialStartDate);
  const [startHour, setStartHour] = useState(props.initialStartHour);
  const [startMinute, setStartMinute] = useState(props.initialStartMinute);
  const [endDate, setEndDate] = useState(props.initialEndDate);
  const [endHour, setEndHour] = useState(props.initialEndHour);
  const [endMinute, setEndMinute] = useState(props.initialEndMinute);
  const [problemSet, setProblemSet] = useState(props.initialProblems);
  const [mode, setMode] = useState(props.initialMode);
  const [
    expectedParticipantUserIdsText,
    setExpectedParticipantUserIdsText
  ] = useState("");
  const [
    expectedParticipantsInputErrorMessage,
    setExpectedParticipantsInputErrorMessage
  ] = useState("");
  const hasExpectedParticipantsInputError =
    expectedParticipantsInputErrorMessage.length > 0;

  const expectedParticipantUserIds =
    expectedParticipantUserIdsText.length > 0
      ? expectedParticipantUserIdsText.split(" ")
      : [];

  if (props.loginState.rejected) {
    return <Redirect to="/" />;
  }

  const { problemMapFetch, problemModelsFetch } = props;
  if (!problemMapFetch.fulfilled || !problemModelsFetch.fulfilled) {
    return null;
  }
  const problemMap = problemMapFetch.value;
  const problemModelMap = problemModelsFetch.value;

  const startSecond = toUnixSecond(startDate, startHour, startMinute);
  const endSecond = toUnixSecond(endDate, endHour, endMinute);
  const isValid = title.length > 0 && startSecond <= endSecond;

  const addProblemsIfNotSelected = (...problems: Problem[]): void => {
    let newProblemSet = problemSet;
    problems.forEach(problem => {
      if (problemSet.every(p => p.id !== problem.id)) {
        newProblemSet = newProblemSet.push({
          id: problem.id,
          point: null,
          order: null
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

      <Row className="my-2">
        <Col>
          <Label>Contest Title</Label>
          <Input
            type="text"
            placeholder="Contest Title"
            value={title}
            onChange={event => setTitle(event.target.value)}
          />
        </Col>
      </Row>

      <Row className="my-2">
        <Col>
          <Label>Description</Label>
          <Input
            type="text"
            placeholder="Description"
            value={memo}
            onChange={event => setMemo(event.target.value)}
          />
        </Col>
      </Row>

      <Row className="my-2">
        <Col>
          <Label>Mode</Label>
          <InputGroup>
            <UncontrolledDropdown>
              <DropdownToggle caret>{formatMode(mode)}</DropdownToggle>
              <DropdownMenu>
                <DropdownItem onClick={() => setMode(null)}>
                  {formatMode(null)}
                </DropdownItem>
                <DropdownItem onClick={() => setMode("lockout")}>
                  {formatMode("lockout")}
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
          </InputGroup>
        </Col>
      </Row>

      <Row className="my-2">
        <Col>
          <Label>Start Time</Label>
          <InputGroup>
            <Input
              type="date"
              value={startDate}
              onChange={event => setStartDate(event.target.value)}
            />
            <Input
              type="select"
              value={startHour}
              onChange={e => setStartHour(Number(e.target.value))}
            >
              {Range(0, 24).map(i => (
                <option key={i}>{i}</option>
              ))}
            </Input>
            <Input
              type="select"
              value={startMinute}
              onChange={e => setStartMinute(Number(e.target.value))}
            >
              {Range(0, 60, 5).map(i => (
                <option key={i}>{i}</option>
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
              onChange={event => setEndDate(event.target.value)}
            />
            <Input
              type="select"
              value={endHour}
              onChange={e => setEndHour(Number(e.target.value))}
            >
              {Range(0, 24).map(i => (
                <option key={i}>{i}</option>
              ))}
            </Input>
            <Input
              type="select"
              value={endMinute}
              onChange={e => setEndMinute(Number(e.target.value))}
            >
              {Range(0, 60, 5).map(i => (
                <option key={i}>{i}</option>
              ))}
            </Input>
          </InputGroup>
        </Col>
      </Row>

      <Row className="my-2">
        <Col>
          <Label>
            Expected Participants
            <HelpBadgeTooltip id={"help-expected-participants"}>
              This list is used for checking if the problems in the list are
              already solved by each participant.
            </HelpBadgeTooltip>
          </Label>
          <Input
            placeholder="AtCoder ID list separated by space"
            value={expectedParticipantUserIdsText}
            invalid={hasExpectedParticipantsInputError}
            onChange={event => {
              setExpectedParticipantUserIdsText(event.target.value);
            }}
          />
          {hasExpectedParticipantsInputError && (
            <FormFeedback>{expectedParticipantsInputErrorMessage}</FormFeedback>
          )}
        </Col>
      </Row>

      <Row>
        <Col>
          <Label>Problems</Label>
        </Col>
      </Row>

      <Row>
        <Col>
          <ContestConfigProblemList
            onSolvedProblemsFetchFinished={errorMessage => {
              setExpectedParticipantsInputErrorMessage(errorMessage || "");
            }}
            problemModelMap={problemModelMap}
            problemMap={problemMap}
            problemSet={problemSet}
            setProblemSet={setProblemSet}
            expectedParticipantUserIds={expectedParticipantUserIds}
          />
        </Col>
      </Row>

      <Row className="my-2">
        <Col>
          <ProblemSearchBox
            problems={problemMap.valueSeq().toArray()}
            selectProblem={addProblemsIfNotSelected}
          />
        </Col>
      </Row>

      <Row>
        <Col>
          <div style={{ padding: 8, border: "solid 1px lightgray" }}>
            <Label>Bacha Gacha</Label>

            <Row className="my-2">
              <Col>
                <ProblemSetGenerator
                  problems={problemMap.valueSeq().toList()}
                  problemModels={problemModelMap}
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
            onClick={() =>
              props.buttonPush({
                title,
                memo,
                startSecond,
                endSecond,
                problems: problemSet,
                mode
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
  problems: List<VirtualContestItem>;
}

interface OuterProps {
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

  buttonPush: (contest: ContestInfo) => void;
  buttonTitle: string;
}

interface InnerProps extends OuterProps {
  problemMapFetch: PromiseState<Map<ProblemId, Problem>>;
  problemModelsFetch: PromiseState<Map<ProblemId, ProblemModel>>;
  loginState: PromiseState<{} | null>;
}

export default connect<OuterProps, InnerProps>(() => ({
  problemMapFetch: {
    comparison: null,
    value: () => CachedApiClient.cachedProblemMap()
  },
  problemModelsFetch: {
    comparison: null,
    value: () => CachedApiClient.cachedProblemModels()
  },
  loginState: {
    url: USER_GET
  }
}))(ContestConfig);

const toUnixSecond = (date: string, hour: number, minute: number) => {
  const hh = hour < 10 ? "0" + hour : "" + hour;
  const mm = minute < 10 ? "0" + minute : "" + minute;
  const s = `${date}T${hh}:${mm}:00+09:00`;
  return moment(s).unix();
};
