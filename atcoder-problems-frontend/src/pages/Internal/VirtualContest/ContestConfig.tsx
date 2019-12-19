import React, { useState } from "react";
import {
  Button,
  Col,
  Input,
  InputGroup,
  Label,
  ListGroup,
  ListGroupItem,
  ListGroupItemHeading,
  ListGroupItemText,
  Row
} from "reactstrap";
import { Range, Set, Map } from "immutable";
import { connect, PromiseState } from "react-refetch";
import * as CachedApiClient from "../../../utils/CachedApiClient";
import { ProblemId } from "../../../interfaces/Status";
import Problem from "../../../interfaces/Problem";
import { formatProblemUrl } from "../../../utils/Url";
import moment from "moment";

const problemMatch = (text: string, problem: Problem) =>
  problem.title.toLowerCase().includes(text.toLowerCase()) ||
  formatProblemUrl(problem.id, problem.contest_id)
    .toLowerCase()
    .includes(text.toLowerCase());

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

  const [problemSearch, setProblemSearch] = useState("");
  const { problemMapFetch } = props;
  if (!problemMapFetch.fulfilled) {
    return null;
  }
  const problemMap = problemMapFetch.value;

  const filterProblems = problemMap
    .valueSeq()
    .filter(
      problem =>
        problemSearch.length > 0 && problemMatch(problemSearch, problem)
    )
    .slice(0, 10);

  return (
    <>
      <Row>
        <h1>{props.pageTitle}</h1>
      </Row>

      <Row className="my-2">
        <Label>Contest Title</Label>
        <Input
          type="text"
          placeholder="Contest Title"
          value={title}
          onChange={event => setTitle(event.target.value)}
        />
      </Row>

      <Row className="my-2">
        <Label>Description</Label>
        <Input
          type="text"
          placeholder="Description"
          value={memo}
          onChange={event => setMemo(event.target.value)}
        />
      </Row>

      <Row className="my-2">
        <Label>Start Time</Label>
        <InputGroup>
          <Input
            type="date"
            value={startDate}
            onChange={event => setStartDate(event.target.value)}
          />
          <Input
            type="select"
            onChange={e => setStartHour(Number(e.target.value))}
          >
            {Range(0, 24).map(i => (
              <option key={i}>{i}</option>
            ))}
          </Input>
          <Input
            type="select"
            onChange={e => setStartMinute(Number(e.target.value))}
          >
            {Range(0, 60, 5).map(i => (
              <option key={i}>{i}</option>
            ))}
          </Input>
        </InputGroup>
      </Row>

      <Row className="my-2">
        <Label>End Time</Label>
        <InputGroup>
          <Input
            type="date"
            value={endDate}
            onChange={event => setEndDate(event.target.value)}
          />
          <Input
            type="select"
            onChange={e => setEndHour(Number(e.target.value))}
          >
            {Range(0, 24).map(i => (
              <option key={i}>{i}</option>
            ))}
          </Input>
          <Input
            type="select"
            onChange={e => setEndMinute(Number(e.target.value))}
          >
            {Range(0, 60, 5).map(i => (
              <option key={i}>{i}</option>
            ))}
          </Input>
        </InputGroup>
      </Row>

      <Row>
        <Label>Problems</Label>
      </Row>

      <Row>
        <Col>
          <ListGroup>
            {problemSet.valueSeq().map(problemId => {
              const problem = problemMap.get(problemId);
              return (
                <ListGroupItem key={problemId}>
                  <Button
                    close
                    onClick={() => setProblemSet(problemSet.remove(problemId))}
                  />
                  {problem ? (
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={formatProblemUrl(problem.id, problem.contest_id)}
                    >
                      {problem.title}
                    </a>
                  ) : (
                    problemId
                  )}
                </ListGroupItem>
              );
            })}
          </ListGroup>
        </Col>
      </Row>

      <Row className="my-2">
        <Input
          type="text"
          placeholder="Search Problems"
          value={problemSearch}
          onChange={e => setProblemSearch(e.target.value)}
        />
        <Col>
          <ListGroup>
            {filterProblems.map(problem => (
              <ListGroupItem
                key={problem.id}
                onClick={() => {
                  setProblemSet(problemSet.add(problem.id));
                  setProblemSearch("");
                }}
              >
                <ListGroupItemHeading>{problem.title}</ListGroupItemHeading>
                <ListGroupItemText>
                  {formatProblemUrl(problem.id, problem.contest_id)}
                </ListGroupItemText>
              </ListGroupItem>
            ))}
          </ListGroup>
        </Col>
      </Row>

      <Row className="my-2">
        <Button
          onClick={() =>
            props.buttonPush({
              title,
              memo,
              startSecond: toUnixSecond(startDate, startHour, startMinute),
              endSecond: toUnixSecond(endDate, endHour, endMinute),
              problems: problemSet
            })
          }
        >
          {props.buttonTitle}
        </Button>
      </Row>
    </>
  );
};

interface ContestInfo {
  title: string;
  memo: string;
  startSecond: number;
  endSecond: number;
  problems: Set<string>;
}

interface OuterProps {
  initialProblems: Set<ProblemId>;
  pageTitle: string;
  initialTitle: string;
  initialMemo: string;
  initialStartDate: string;
  initialStartHour: number;
  initialStartMinute: number;
  initialEndDate: string;
  initialEndHour: number;
  initialEndMinute: number;

  buttonPush: (contest: ContestInfo) => void;
  buttonTitle: string;
}

interface InnerProps extends OuterProps {
  problemMapFetch: PromiseState<Map<ProblemId, Problem>>;
}

export default connect<OuterProps, InnerProps>(() => ({
  problemMapFetch: {
    comparison: null,
    value: () => CachedApiClient.cachedProblemMap()
  }
}))(ContestConfig);

const toUnixSecond = (date: string, hour: number, minute: number) => {
  const hh = hour < 10 ? "0" + hour : "" + hour;
  const mm = minute < 10 ? "0" + minute : "" + minute;
  const s = `${date}T${hh}:${mm}:00+09:00`;
  return moment(s).unix();
};
