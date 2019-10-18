import React from "react";
import { isAccepted } from "../../utils";
import Table from "reactstrap/lib/Table";
import Submission from "../../interfaces/Submission";
import { List, Map } from "immutable";
import MergedProblem from "../../interfaces/MergedProblem";

interface Props {
  mergedProblems: Map<string, MergedProblem>;
  submissions: Map<string, List<Submission>>;
  userIds: List<string>;
  setFilterFunc: (point: number) => any;
}

const SmallTable = ({
  submissions,
  userIds,
  mergedProblems,
  setFilterFunc
}: Props) => {
  const userPointCount = userIds
    .filter(userId => userId.length > 0)
    .map(userId => ({
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
        .map(p => (p && p.point ? p.point : undefined))
        .filter((p: number | undefined): p is number => p !== undefined)
        .reduce(
          (map, point) => map.update(point, 0, count => count + 1),
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
            <th key={point}>
              <a
                href={window.location.hash}
                onClick={() => setFilterFunc(point)}
              >
                {point}
              </a>
            </th>
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
