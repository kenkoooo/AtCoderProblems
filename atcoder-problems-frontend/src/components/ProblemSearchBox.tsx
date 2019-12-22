import {
  Col,
  Input,
  ListGroup,
  ListGroupItem,
  ListGroupItemHeading,
  ListGroupItemText
} from "reactstrap";
import React, { useState } from "react";
import { formatProblemUrl } from "../utils/Url";
import Problem from "../interfaces/Problem";
import { List } from "immutable";

const problemMatch = (text: string, problem: Problem) => {
  return text.split("").every(
    word =>
      word.length > 0 &&
      (problem.title.toLowerCase().includes(word.toLowerCase()) ||
        formatProblemUrl(problem.id, problem.contest_id)
          .toLowerCase()
          .includes(word.toLowerCase()))
  );
};

interface Props {
  problems: List<Problem>;
  selectProblem: (problem: Problem) => void;
}

export default (props: Props) => {
  const [problemSearch, setProblemSearch] = useState("");
  const [focusingId, setFocusingId] = useState(-1);

  const filterProblems = props.problems
    .filter(p => problemMatch(problemSearch, p))
    .slice(0, 20);
  return (
    <>
      <Input
        type="text"
        placeholder="Search Problems"
        value={problemSearch}
        onChange={e => {
          setProblemSearch(e.target.value);
          setFocusingId(-1);
        }}
        onKeyDown={e => {
          if (e.key === "Enter") {
            const problem = filterProblems.get(focusingId);
            if (problem) {
              props.selectProblem(problem);
              setProblemSearch("");
              setFocusingId(-1);
            }
          } else if (e.key === "ArrowDown") {
            setFocusingId(Math.min(filterProblems.size - 1, focusingId + 1));
          } else if (e.key === "ArrowUp") {
            setFocusingId(Math.max(-1, focusingId - 1));
          }
        }}
      />
      <ListGroup>
        {filterProblems.map((problem, i) => (
          <ListGroupItem
            active={i === focusingId}
            key={problem.id}
            onClick={() => {
              props.selectProblem(problem);
              setProblemSearch("");
              setFocusingId(-1);
            }}
          >
            <ListGroupItemHeading>{problem.title}</ListGroupItemHeading>
            <ListGroupItemText>
              {formatProblemUrl(problem.id, problem.contest_id)}
            </ListGroupItemText>
          </ListGroupItem>
        ))}
      </ListGroup>
    </>
  );
};
