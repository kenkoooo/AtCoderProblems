import React, { useState } from "react";
import { isAccepted } from "../../utils";
import Table from "reactstrap/lib/Table";
import Submission from "../../interfaces/Submission";
import { List, Map as ImmutableMap, Range } from "immutable";
import MergedProblem from "../../interfaces/MergedProblem";
import ProblemModel from "../../interfaces/ProblemModel";
import { DifficultyCircle } from "../../components/DifficultyCircle";
import { ProblemId } from "../../interfaces/Status";
import { Button, ButtonGroup } from "reactstrap";

interface Props {
  mergedProblems: ImmutableMap<ProblemId, MergedProblem>;
  submissions: Submission[];
  problemModels: ImmutableMap<ProblemId, ProblemModel>;
  setFilterFunc: (from: number, to: number) => void;
}

const INF_POINT = 1e18;
const DIFF_WIDTH = 400;
const DIFF_MAX = 4000;

const problemToDifficultyLevel = (
  problem: MergedProblem,
  problemModels: ImmutableMap<ProblemId, ProblemModel>,
  showExperimental: boolean
): number | undefined => {
  const problemModel = problemModels.get(problem.id);
  if (problemModel === undefined) {
    return undefined;
  }
  if (problemModel.is_experimental && !showExperimental) {
    return undefined;
  }
  if (problemModel.difficulty === undefined) {
    return undefined;
  } else {
    return Math.floor(Math.min(DIFF_MAX, problemModel.difficulty) / DIFF_WIDTH);
  }
};

export const DifficultyTable: React.FC<Props> = (props) => {
  const { submissions, mergedProblems, problemModels, setFilterFunc } = props;
  const [includingExperimental, setIncludingExperimental] = useState(true);
  const difficulties: List<{ from: number; to: number }> = Range(
    0,
    4400,
    DIFF_WIDTH
  )
    .map((from) => ({
      from,
      to: from === DIFF_MAX ? INF_POINT : from + DIFF_WIDTH - 1,
    }))
    .toList();

  const userProblemIds = submissions
    .filter((s) => isAccepted(s.result))
    .reduce((map, submission) => {
      const problemIds = map.get(submission.user_id) ?? new Set<string>();
      problemIds.add(submission.problem_id);
      map.set(submission.user_id, problemIds);
      return map;
    }, new Map<string, Set<string>>());
  const userDiffCount = Array.from(userProblemIds.keys()).map((userId) => {
    const diffCount = Array.from(
      userProblemIds.get(userId) ?? new Set<string>()
    )
      .map((problemId) => mergedProblems.get(problemId))
      .map((problem) =>
        problem
          ? problemToDifficultyLevel(
              problem,
              problemModels,
              includingExperimental
            )
          : undefined
      )
      .reduce((map, difficulty) => {
        if (difficulty !== undefined) {
          const count = map.get(difficulty) ?? 0;
          map.set(difficulty, count + 1);
        }
        return map;
      }, new Map<number, number>());

    return { userId, diffCount };
  });

  const totalCount = mergedProblems
    .map((problem) =>
      problemToDifficultyLevel(problem, problemModels, includingExperimental)
    )
    .filter((d): d is number => d !== undefined)
    .reduce(
      (countMap, difficultyLevel) =>
        countMap.update(difficultyLevel, 0, (count) => count + 1),
      ImmutableMap<number, number>()
    )
    .entrySeq()
    .map(([difficultyLevel, count]) => ({ difficultyLevel, count }))
    .sort((a, b) => a.difficultyLevel - b.difficultyLevel);

  return (
    <>
      <ButtonGroup className="mb-2">
        <Button
          onClick={(): void => setIncludingExperimental(!includingExperimental)}
        >
          {includingExperimental ? "Including 🧪" : "Excluding 🧪"}
        </Button>
      </ButtonGroup>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Difficulty</th>
            {totalCount.map(({ difficultyLevel }) => (
              <th key={difficultyLevel} style={{ whiteSpace: "nowrap" }}>
                <a
                  href={window.location.hash}
                  onClick={(): void =>
                    setFilterFunc(
                      difficulties.get(difficultyLevel, { from: 0 }).from,
                      difficulties.get(difficultyLevel, { to: INF_POINT }).to
                    )
                  }
                >
                  <DifficultyCircle
                    difficulty={
                      difficulties.get(difficultyLevel, { from: INF_POINT })
                        .from + 399
                    }
                    id={`difficulty-table-level-${difficultyLevel}`}
                  />
                  {difficulties.get(difficultyLevel, { from: 0 }).from}-
                </a>
              </th>
            ))}
          </tr>
          <tr>
            <th>Total</th>
            {totalCount.map(({ difficultyLevel, count }) => (
              <th key={difficultyLevel}>{count}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {userDiffCount.map(({ userId, diffCount }) => (
            <tr key={userId}>
              <td>{userId}</td>
              {totalCount.map(({ difficultyLevel }) => (
                <td key={difficultyLevel}>
                  {diffCount.get(difficultyLevel) ?? 0}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
};
