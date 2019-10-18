import React from "react";
import { isAccepted } from "../../utils";
import Table from "reactstrap/lib/Table";
import Submission from "../../interfaces/Submission";
import { List, Map, Range } from "immutable";
import MergedProblem from "../../interfaces/MergedProblem";
import ProblemModel from "../../interfaces/ProblemModel";
import { DifficultyCircle } from "../../components/DifficultyCircle";

interface Props {
  mergedProblems: Map<string, MergedProblem>;
  submissions: Map<string, List<Submission>>;
  userIds: List<string>;
  problemModels: Map<string, ProblemModel>;
  setFilterFunc: (from: number, to: number) => any;
}

const INF_POINT = 1e18;

const DifficultyTable = ({
  submissions,
  userIds,
  mergedProblems,
  problemModels,
  setFilterFunc
}: Props) => {
  const difficulties: List<{ from: number; to: number }> = Range(0, 4400, 400)
    .map(from => ({
      from,
      to: from === 4000 ? INF_POINT : from + 399
    }))
    .toList();
  const userPointCount = userIds
    .filter(userId => userId.length > 0)
    .map(userId => ({
      userId,
      difficultyLevelCounts: submissions
        .map(list =>
          list
            .filter(s => s.user_id === userId)
            .filter(s => isAccepted(s.result))
            .map(s => mergedProblems.get(s.problem_id))
            .filter(p => p && problemModels.has(p.id))
            .filter((p): p is MergedProblem => p !== undefined)
            .map(p => problemModels.getIn([p.id, "difficulty"], undefined))
            .first(undefined)
        )
        .valueSeq()
        .filter((d: number | undefined): d is number => d !== undefined)
        .reduce(
          (map, difficulty) =>
            map.update(
              Math.floor(Math.min(4000, difficulty) / 400),
              0,
              count => count + 1
            ),
          Map<number, number>()
        )
    }));
  const totalCount = mergedProblems
    .map(p => problemModels.getIn([p.id, "difficulty"], undefined))
    .filter((d): d is number => d !== undefined)
    .map(d => Math.floor(Math.min(4000, d) / 400))
    .reduce(
      (map, d) => map.update(d, 0, count => count + 1),
      Map<number, number>()
    )
    .entrySeq()
    .map(([difficultyLevel, count]) => ({ difficultyLevel, count }))
    .sort((a, b) => a.difficultyLevel - b.difficultyLevel);

  return (
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
  );
};

export default DifficultyTable;
