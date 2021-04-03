import React from "react";
import {
  Button,
  Input,
  InputGroup,
  InputGroupAddon,
  ListGroup,
  ListGroupItem,
  ButtonGroup,
} from "reactstrap";
import Octicon, { ChevronUp, ChevronDown } from "@primer/octicons-react";
import {
  useMultipleUserSubmissions,
  useProblemMap,
  useProblemModelMap,
} from "../../../api/APIClient";
import { ProblemId, UserId } from "../../../interfaces/Status";
import { VirtualContestItem } from "../types";
import { ProblemLink } from "../../../components/ProblemLink";
import { isAccepted } from "../../../utils";

interface Props {
  problemSet: VirtualContestItem[];
  setProblemSet: (newProblemSet: VirtualContestItem[]) => void;
  expectedParticipantUserIds: string[];
  onSolvedProblemsFetchFinished: (errorMessage?: string | null) => void;
}

export const ContestConfigProblemList: React.FC<Props> = (props) => {
  const { problemSet } = props;
  const problemMap = useProblemMap();
  const problemModels = useProblemModelMap();
  const solvedProblemIdsByUser = (
    useMultipleUserSubmissions(props.expectedParticipantUserIds).data ?? []
  )
    .filter((submission) => isAccepted(submission.result))
    .reduce((map, submission) => {
      const userId = submission.user_id;
      const problemIds = map.get(userId) ?? new Set<ProblemId>();
      problemIds.add(submission.problem_id);
      map.set(userId, problemIds);
      return map;
    }, new Map<UserId, Set<ProblemId>>());

  return (
    <ListGroup>
      {problemSet.length === 0 && (
        <ListGroupItem>
          You have not added any problems yet. Use the search box below to
          search for problems to add to the contest.
        </ListGroupItem>
      )}

      {problemSet.map((p, i) => {
        const problemId = p.id;
        const problem = problemMap?.get(problemId);
        const solvedUsers =
          (problem &&
            Array.from(solvedProblemIdsByUser)
              .filter(([, problemIds]) => problemIds.has(problem.id))
              .map(([user]) => user)) ??
          [];
        return (
          <ListGroupItem
            key={problemId}
            style={{ backgroundColor: solvedUsers.length > 0 ? "#ffeeee" : "" }}
          >
            <Button
              close
              onClick={(): void => {
                props.setProblemSet(
                  problemSet.filter((x) => x.id !== problemId)
                );
              }}
            />
            {problem ? (
              <ProblemLink
                problemId={problem.id}
                contestId={problem.contest_id}
                problemTitle={problem.title}
                showDifficulty={true}
                problemModel={problemModels?.get(problemId)}
                isExperimentalDifficulty={
                  problemModels?.get(problemId)?.is_experimental
                }
              />
            ) : (
              problemId
            )}
            {solvedUsers.length > 0 && <> solved by {solvedUsers.join(", ")}</>}
            <ButtonGroup
              size="sm"
              style={{ float: "right", marginRight: "1rem" }}
            >
              {p.point === null ? (
                <Button
                  onClick={(): void => {
                    const newProblemSet = [...problemSet];
                    newProblemSet[i] = { ...problemSet[i], point: 0 };
                    props.setProblemSet(newProblemSet);
                  }}
                >
                  Set Point
                </Button>
              ) : null}
              <Button
                disabled={i === 0}
                onClick={(): void => {
                  const nextFirst = problemSet[i];
                  const nextSecond = problemSet[i - 1];
                  if (nextFirst && nextSecond) {
                    const newProblemSet = [...problemSet];
                    newProblemSet[i - 1] = nextFirst;
                    newProblemSet[i] = nextSecond;
                    props.setProblemSet(newProblemSet);
                  }
                }}
              >
                <Octicon icon={ChevronUp} />
              </Button>
              <Button
                disabled={i === problemSet.length - 1}
                onClick={(): void => {
                  const nextFirst = problemSet[i + 1];
                  const nextSecond = problemSet[i];
                  if (nextFirst && nextSecond) {
                    const newProblemSet = [...problemSet];
                    newProblemSet[i] = nextFirst;
                    newProblemSet[i + 1] = nextSecond;
                    props.setProblemSet(newProblemSet);
                  }
                }}
              >
                <Octicon icon={ChevronDown} />
              </Button>
            </ButtonGroup>
            {p.point !== null ? (
              <InputGroup style={{ marginTop: "1rem" }}>
                <Input
                  type="number"
                  defaultValue={p.point}
                  onChange={(e): void => {
                    const parse = parseInt(e.target.value, 10);
                    const point = !isNaN(parse) ? parse : 0;
                    const newProblemSet = [...problemSet];
                    newProblemSet[i] = { ...problemSet[i], point };
                    props.setProblemSet(newProblemSet);
                  }}
                />
                <InputGroupAddon addonType="append">
                  <Button
                    onClick={(): void => {
                      const newProblemSet = [...problemSet];
                      newProblemSet[i] = { ...problemSet[i], point: null };
                      props.setProblemSet(newProblemSet);
                    }}
                  >
                    Unset
                  </Button>
                </InputGroupAddon>
              </InputGroup>
            ) : null}
          </ListGroupItem>
        );
      })}
    </ListGroup>
  );
};
