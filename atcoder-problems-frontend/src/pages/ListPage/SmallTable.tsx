import React from "react";
import Table from "reactstrap/lib/Table";
import { Map as ImmutableMap } from "immutable";
import { isAccepted } from "../../utils";
import { TableColor } from "../../utils/TableColor";
import Submission from "../../interfaces/Submission";
import MergedProblem from "../../interfaces/MergedProblem";

interface Props {
  mergedProblems: ImmutableMap<string, MergedProblem>;
  submissions: Submission[];
  setFilterFunc: (point: number) => void;
}

export const SmallTable: React.FC<Props> = ({
  submissions,
  mergedProblems,
  setFilterFunc,
}) => {
  const userProblemIdSet = new Map<string, Set<string>>();
  submissions
    .filter((s) => isAccepted(s.result))
    .forEach((submission) => {
      const problemIdSet =
        userProblemIdSet.get(submission.user_id) ?? new Set<string>();
      problemIdSet.add(submission.problem_id);
      userProblemIdSet.set(submission.user_id, problemIdSet);
    });

  const userPointCountMap = Array.from(userProblemIdSet.keys()).map(
    (userId) => {
      const problemIdSet = userProblemIdSet.get(userId) ?? new Set<string>();
      const pointCountMap = new Map<number, number>();
      Array.from(problemIdSet).forEach((problemId) => {
        const point = mergedProblems.get(problemId)?.point;
        if (point) {
          const count = pointCountMap.get(point) ?? 0;
          pointCountMap.set(point, count + 1);
        }
      });
      return { userId, pointCountMap };
    }
  );

  const totalCount = mergedProblems
    .reduce(
      (map, p) =>
        p.point ? map.update(p.point, 0, (count) => count + 1) : map,
      ImmutableMap<number, number>()
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
                onClick={(): void => setFilterFunc(point)}
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
        {userPointCountMap.map(({ userId, pointCountMap }) => (
          <tr key={userId}>
            <td>{userId}</td>
            {totalCount.map(({ point, count }) => (
              <td
                key={point}
                className={
                  pointCountMap.get(point) === count
                    ? TableColor.Success
                    : TableColor.None
                }
              >
                {pointCountMap.get(point) ?? 0}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
};
