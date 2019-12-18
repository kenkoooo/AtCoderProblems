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
import { Range, Map } from "immutable";
import { connect, PromiseState } from "react-refetch";
import * as CachedApiClient from "../../utils/CachedApiClient";
import { ProblemId } from "../../interfaces/Status";
import Problem from "../../interfaces/Problem";
import { formatProblemUrl } from "../../utils/Url";

const problemMatch = (text: string, problem: Problem) =>
  problem.title.toLowerCase().includes(text.toLowerCase()) ||
  problem.id.toLowerCase().includes(text.toLowerCase()) ||
  problem.contest_id.toLowerCase().includes(text.toLowerCase());

const CreateContestPage = (props: InnerProps) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [problemSearch, setProblemSearch] = useState("");
  const [problemSet, setProblemSet] = useState(Map<ProblemId, Problem>());

  const problems = props.problemMapFetch.fulfilled
    ? props.problemMapFetch.value.valueSeq().toArray()
    : Array<Problem>();

  const filterProblems = problems
    .filter(
      problem =>
        problemSearch.length > 0 && problemMatch(problemSearch, problem)
    )
    .slice(0, 10);

  return (
    <>
      <Row>
        <h1>Create a virtual contest</h1>
      </Row>

      <Row className="my-2">
        <Label>Contest Title</Label>
        <Input type="text" placeholder="Contest Title" />
      </Row>

      <Row className="my-2">
        <Label>Start Time</Label>
        <InputGroup>
          <Input
            type="date"
            value={startDate}
            onChange={i => {
              if (i.target.value) {
                setStartDate(i.target.value);
              }
            }}
          />
          <Input type="select">
            {Range(0, 24).map(i => (
              <option key={i}>{i}</option>
            ))}
          </Input>
          <Input type="select">
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
            onChange={i => {
              if (i.target.value) {
                setEndDate(i.target.value);
              }
            }}
          />
          <Input type="select">
            {Range(0, 24).map(i => (
              <option key={i}>{i}</option>
            ))}
          </Input>
          <Input type="select">
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
            {problemSet.valueSeq().map(problem => (
              <ListGroupItem key={problem.id}>
                <Button
                  close
                  onClick={() => setProblemSet(problemSet.remove(problem.id))}
                />
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={formatProblemUrl(problem.id, problem.contest_id)}
                >
                  {problem.title}
                </a>
              </ListGroupItem>
            ))}
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
                  setProblemSet(problemSet.set(problem.id, problem));
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
            props.createContest({
              title: "a",
              memo: "neno",
              start_epoch_second: 0,
              duration_second: 1
            })
          }
        >
          Create
        </Button>
      </Row>
    </>
  );
};

interface Request {
  title: string;
  memo: string;
  start_epoch_second: number;
  duration_second: number;
}

interface Response {
  contest_id: string;
}

interface InnerProps {
  problemMapFetch: PromiseState<Map<ProblemId, Problem>>;
  createContestResponse: PromiseState<Response>;
  createContest: (reqiest: Request) => void;
}

const mapper = () => {
  return {
    createContest: (request: Request) => ({
      createContestResponse: {
        url:
          "http://kenkoooo.com/atcoder/atcoder-api/results/v3/internal/contest/create",
        method: "POST",
        body: JSON.stringify(request)
      }
    }),
    problemMapFetch: {
      comparison: null,
      value: () => CachedApiClient.cachedProblemMap()
    },
    createContestResponse: {
      value: []
    }
  };
};

export default connect<{}, InnerProps>(mapper)(CreateContestPage);
