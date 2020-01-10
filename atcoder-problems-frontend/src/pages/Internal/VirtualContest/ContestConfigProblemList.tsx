import React from "react";
import {
  Button,
  Input,
  InputGroup,
  InputGroupAddon,
  ListGroup,
  ListGroupItem
} from "reactstrap";
import { List, Map, Set } from "immutable";
import { connect, PromiseState } from "react-refetch";
import { cachedSubmissions } from "../../../utils/CachedApiClient";
import Problem from "../../../interfaces/Problem";
import { VirtualContestItem } from "../types";
import ProblemLink from "../../../components/ProblemLink";
import ProblemModel from "../../../interfaces/ProblemModel";
import { isAccepted } from "../../../utils";

const ContestConfigProblemList = (props: InnerProps) => {
  return (
    <ListGroup>
      {props.problemSet.valueSeq().map((p, i) => {
        const problemId = p.id;
        const problem = props.problemMap.get(problemId);

        const solvedUsers =
          problem && props.userSolvedSubmissionsMapFetch.fulfilled
            ? Object.entries(props.userSolvedSubmissionsMapFetch.value)
                .filter(([user, submissions]) =>
                  submissions.contains(problem.id)
                )
                .map(([user, ignored]) => user)
            : [];

        return (
          <ListGroupItem
            key={problemId}
            style={{ backgroundColor: solvedUsers.length > 0 ? "#ffeeee" : "" }}
          >
            <Button
              close
              onClick={() => {
                props.setProblemSet(
                  props.problemSet.filter(x => x.id !== problemId)
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
            {p.point === null ? (
              <Button
                style={{ float: "right" }}
                onClick={() => {
                  props.setProblemSet(
                    props.problemSet.update(i, x => ({
                      ...x,
                      point: 0
                    }))
                  );
                }}
              >
                Set Point
              </Button>
            ) : null}
            {p.point !== null ? (
              <InputGroup>
                <Input
                  type="number"
                  value={p.point}
                  onChange={e => {
                    const parse = parseInt(e.target.value, 10);
                    const point = !isNaN(parse) ? parse : 0;
                    props.setProblemSet(
                      props.problemSet.update(i, x => ({
                        ...x,
                        point
                      }))
                    );
                  }}
                />
                <InputGroupAddon addonType="append">
                  <Button
                    onClick={() => {
                      props.setProblemSet(
                        props.problemSet.update(i, x => ({
                          ...x,
                          point: null
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
}

interface InnerProps extends OuterProps {
  userSolvedSubmissionsMapFetch: PromiseState<{ [user: string]: Set<string> }>;
}

export default connect<OuterProps, InnerProps>(props => ({
  userSolvedSubmissionsMapFetch: {
    comparison: props.expectedParticipantUserIds,
    refreshing: true,
    value: async () => {
      const res: { [problem: string]: Set<string> } = {};
      for (const userId of props.expectedParticipantUserIds) {
        try {
          const submissions = await cachedSubmissions(userId);
          res[userId] = submissions
            .filter(submission => isAccepted(submission.result))
            .map(submission => submission.problem_id)
            .toSet();
        } catch (e) {
          // ignore
        }
      }
      return res;
    }
  }
}))(ContestConfigProblemList);
