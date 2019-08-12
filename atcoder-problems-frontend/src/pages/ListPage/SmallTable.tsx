import React from "react";
import { isAccepted } from "../../utils";
import Table from "reactstrap/lib/Table";
import Submission from "../../interfaces/Submission";
import { List, Map, Set } from "immutable";
import MergedProblem from "../../interfaces/MergedProblem";

interface Props {
  mergedProblems: Map<string, MergedProblem>;
  submissions: Map<string, List<Submission>>;
  userIds: List<string>;
}

const SmallTable = ({ submissions, userIds, mergedProblems }: Props) => {
  const userPointCount = userIds.map(userId => ({
    userId,
    points: submissions
      .map(list =>
        list
          .filter(s => s.user_id === userId)
          .filter(s => isAccepted(s.result))
          .map(s => mergedProblems.get(s.problem_id))
          .filter(p => p && p.point)
          .first(undefined)
      )
      .valueSeq()
      .reduce(
        (map, problem) =>
          problem && problem.point
            ? map.update(problem.point, 0, count => count + 1)
            : map,
        Map<number, number>()
      )
  }));
  const totalCount = mergedProblems
    .reduce(
      (map, p) => (p.point ? map.update(p.point, 0, count => count + 1) : map),
      Map<number, number>()
    )
    .entrySeq()
    .map(([point, count]) => ({ point, count }))
    .sort((a, b) => a.point - b.point);

  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>Point</th>
          {totalCount.map(({ point }) => (
            <th key={point}>{point}</th>
          ))}
        </tr>
        <tr>
          <th>Total</th>
          {totalCount.map(({ point, count }) => (
            <th key={point}>{count}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {userPointCount.map(({ userId, points }) => (
          <tr key={userId}>
            <td>{userId}</td>
            {totalCount.map(({ point }) => (
              <td key={point}>{points.get(point, 0)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default SmallTable;
