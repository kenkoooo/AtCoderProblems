import React, { useState } from "react";
import { isAccepted } from "../../utils";
import Table from "reactstrap/lib/Table";
import Submission from "../../interfaces/Submission";
import { List, Map, Range } from "immutable";
import MergedProblem from "../../interfaces/MergedProblem";
import ProblemModel from "../../interfaces/ProblemModel";
import { DifficultyCircle } from "../../components/DifficultyCircle";
import { ProblemId } from "../../interfaces/Status";
import { Button, ButtonGroup } from "reactstrap";

interface Props {
  mergedProblems: Map<ProblemId, MergedProblem>;
  submissions: Map<ProblemId, List<Submission>>;
  userIds: List<string>;
  problemModels: Map<ProblemId, ProblemModel>;
  setFilterFunc: (from: number, to: number) => void;
}

const INF_POINT = 1e18;
const DIFF_WIDTH = 400;
const DIFF_MAX = 4000;

const problemToDifficultyLevel = (
  problem: MergedProblem,
  problemModels: Map<ProblemId, ProblemModel>,
  showExperimental: boolean
) => {
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

const DifficultyTable = (props: Props) => {
  const {
    submissions,
    userIds,
    mergedProblems,
    problemModels,
    setFilterFunc
  } = props;
  const [includingExperimental, setIncludingExperimental] = useState(true);
  const difficulties: List<{ from: number; to: number }> = Range(
    0,
    4400,
    DIFF_WIDTH
  )
    .map(from => ({
      from,
      to: from === DIFF_MAX ? INF_POINT : from + DIFF_WIDTH - 1
    }))
    .toList();
  const userPointCount = userIds
    .filter(userId => userId.length > 0)
    .map(userId => {
      const difficultyLevelCounts = submissions
        .valueSeq()
        .map(problemSubmissions =>
          problemSubmissions
            .filter(s => s.user_id === userId)
            .filter(s => isAccepted(s.result))
            .map(s => mergedProblems.get(s.problem_id))
            .filter((p): p is MergedProblem => p !== undefined)
            .map(problem =>
              problemToDifficultyLevel(
                problem,
                problemModels,
                includingExperimental
              )
            )
            .first(undefined)
        )
        .filter((d: number | undefined): d is number => d !== undefined)
        .reduce(
          (countMap, difficultyLevel) =>
            countMap.update(difficultyLevel, 0, count => count + 1),
          Map<number, number>()
        );
      return { userId, difficultyLevelCounts };
    });
  const totalCount = mergedProblems
    .map(problem =>
      problemToDifficultyLevel(problem, problemModels, includingExperimental)
    )
    .filter((d): d is number => d !== undefined)
    .reduce(
      (countMap, difficultyLevel) =>
        countMap.update(difficultyLevel, 0, count => count + 1),
      Map<number, number>()
    )
    .entrySeq()
    .map(([difficultyLevel, count]) => ({ difficultyLevel, count }))
    .sort((a, b) => a.difficultyLevel - b.difficultyLevel);

  return (
    <>
      <ButtonGroup className="mb-2">
        <Button
          onClick={() => setIncludingExperimental(!includingExperimental)}
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
                  onClick={() =>
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
          {userPointCount.map(({ userId, difficultyLevelCounts }) => (
            <tr key={userId}>
              <td>{userId}</td>
              {totalCount.map(({ difficultyLevel }) => (
                <td key={difficultyLevel}>
                  {difficultyLevelCounts.get(difficultyLevel, 0)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
};

export default DifficultyTable;
