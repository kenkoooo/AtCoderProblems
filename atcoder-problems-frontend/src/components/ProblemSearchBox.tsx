import {
  Input,
  ListGroup,
  ListGroupItem,
  ListGroupItemHeading,
  ListGroupItemText,
} from "reactstrap";
import React, { useState } from "react";
import { formatProblemUrl } from "../utils/Url";
import Problem from "../interfaces/Problem";

const problemMatch = (text: string, problem: Problem): boolean => {
  return (
    text.length > 0 &&
    text
      .split(/\s/)
      .every(
        (word) =>
          (word.trim().length > 0 &&
            problem.name.toLowerCase().includes(word.toLowerCase())) ||
          formatProblemUrl(problem.id, problem.contest_id)
            .toLowerCase()
            .includes(word.toLowerCase())
      )
  );
};

interface Props {
  problems: Problem[];
  selectProblem:
    | ((problem: Problem) => void)
    | ((problem: Problem) => Promise<void>);
}

export const ProblemSearchBox: React.FC<Props> = (props) => {
  const [problemSearch, setProblemSearch] = useState("");
  const [focusingId, setFocusingId] = useState(-1);

  const filterProblems = props.problems
    .filter((p) => problemMatch(problemSearch, p))
    .slice(0, 20);
  return (
    <>
      <Input
        type="text"
        placeholder="Search here to add problems."
        value={problemSearch}
        onChange={(e): void => {
          setProblemSearch(e.target.value);
          setFocusingId(-1);
        }}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onKeyDown={async (e) => {
          if (e.key === "Enter") {
            const problem =
              filterProblems.length > focusingId
                ? filterProblems[focusingId]
                : undefined;
            if (problem) {
              await props.selectProblem(problem);
              setProblemSearch("");
              setFocusingId(-1);
            }
          } else if (e.key === "ArrowDown") {
            setFocusingId(Math.min(filterProblems.length - 1, focusingId + 1));
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
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClick={async () => {
              await props.selectProblem(problem);
              setProblemSearch("");
              setFocusingId(-1);
            }}
          >
            <ListGroupItemHeading>
              {problem.problem_index}. {problem.name}
            </ListGroupItemHeading>
            <ListGroupItemText>
              {formatProblemUrl(problem.id, problem.contest_id)}
            </ListGroupItemText>
          </ListGroupItem>
        ))}
      </ListGroup>
    </>
  );
};
