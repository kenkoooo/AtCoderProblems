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
import { List, Map, Set } from "immutable";
import { connect, PromiseState } from "react-refetch";
import Octicon, { ChevronUp, ChevronDown } from "@primer/octicons-react";
import { cachedSubmissions } from "../../../utils/CachedApiClient";
import Problem from "../../../interfaces/Problem";
import { VirtualContestItem } from "../types";
import ProblemLink from "../../../components/ProblemLink";
import ProblemModel from "../../../interfaces/ProblemModel";
import { isAccepted } from "../../../utils";

const ContestConfigProblemList: React.FC<InnerProps> = (props) => {
  const { problemSet } = props;
  return (
    <ListGroup>
      {problemSet.valueSeq().map((p, i) => {
        const problemId = p.id;
        const problem = props.problemMap.get(problemId);

        const solvedUsers =
          problem && props.userSolvedProblemsMapFetch.fulfilled
            ? Object.entries(props.userSolvedProblemsMapFetch.value)
                .filter(([, solvedProblems]) =>
                  solvedProblems.contains(problem.id)
                )
                .map(([user]) => user)
            : [];

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
                difficulty={props.problemModelMap.get(problemId)?.difficulty}
                isExperimentalDifficulty={
                  props.problemModelMap.get(problemId)?.is_experimental
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
                    props.setProblemSet(
                      problemSet.update(i, (x) => ({
                        ...x,
                        point: 0,
                      }))
                    );
                  }}
                >
                  Set Point
                </Button>
              ) : null}
              <Button
                disabled={i === 0}
                onClick={(): void => {
                  const nextFirst = problemSet.get(i);
                  const nextSecond = problemSet.get(i - 1);
                  if (nextFirst && nextSecond) {
                    props.setProblemSet(
                      problemSet.set(i - 1, nextFirst).set(i, nextSecond)
                    );
                  }
                }}
              >
                <Octicon icon={ChevronUp} />
              </Button>
              <Button
                disabled={i === problemSet.size - 1}
                onClick={(): void => {
                  const nextFirst = problemSet.get(i + 1);
                  const nextSecond = problemSet.get(i);
                  if (nextFirst && nextSecond) {
                    props.setProblemSet(
                      problemSet.set(i, nextFirst).set(i + 1, nextSecond)
                    );
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
                    props.setProblemSet(
                      problemSet.update(i, (x) => ({
                        ...x,
                        point,
                      }))
                    );
                  }}
                />
                <InputGroupAddon addonType="append">
                  <Button
                    onClick={(): void => {
                      props.setProblemSet(
                        problemSet.update(i, (x) => ({
                          ...x,
                          point: null,
                        }))
                      );
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

interface OuterProps {
  problemModelMap: Map<string, ProblemModel>;
  problemMap: Map<string, Problem>;
  problemSet: List<VirtualContestItem>;
  setProblemSet: (newProblemSet: List<VirtualContestItem>) => void;
  expectedParticipantUserIds: string[];
  onSolvedProblemsFetchFinished: (errorMessage?: string | null) => void;
}

interface InnerProps extends OuterProps {
  userSolvedProblemsMapFetch: PromiseState<{ [user: string]: Set<string> }>;
}

export default connect<OuterProps, InnerProps>((props) => ({
  userSolvedProblemsMapFetch: {
    comparison: props.expectedParticipantUserIds,
    refreshing: true,
    value: async (): Promise<{ [problem: string]: Set<string> }> => {
      const res: { [problem: string]: Set<string> } = {};
      const failedUserIds: string[] = [];
      for (const userId of props.expectedParticipantUserIds) {
        try {
          const submissions = await cachedSubmissions(userId);
          res[userId] = submissions
            .filter((submission) => isAccepted(submission.result))
            .map((submission) => submission.problem_id)
            .toSet();
        } catch (e) {
          failedUserIds.push(userId);
        }
      }
      if (failedUserIds.length > 0) {
        props.onSolvedProblemsFetchFinished(
          `Fetch Failed for ${failedUserIds.join(", ")}`
        );
      } else {
        props.onSolvedProblemsFetchFinished();
      }
      return res;
    },
  },
}))(ContestConfigProblemList);
