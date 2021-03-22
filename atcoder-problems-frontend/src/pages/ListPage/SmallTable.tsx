import React from "react";
import { Table } from "reactstrap";
import { ProblemId } from "../../interfaces/Status";
import { isAccepted } from "../../utils";
import { countBy, groupBy } from "../../utils/GroupBy";
import { TableColor } from "../../utils/TableColor";
import Submission from "../../interfaces/Submission";
import MergedProblem from "../../interfaces/MergedProblem";

interface Props {
  mergedProblems: Map<ProblemId, MergedProblem>;
  submissions: Submission[];
  setFilterFunc: (point: number) => void;
}

export const getTotalCount = (
  mergedProblems: Map<ProblemId, MergedProblem>
) => {
  const totalCountMap = countBy(
    Array.from(mergedProblems.values()),
    (p) => p.point
  );
  return Array.from(totalCountMap.entries())
    .filter(
      (pair: [number | null | undefined, number]): pair is [number, number] =>
        typeof pair[0] === "number"
    )
    .map(([point, count]) => ({ point, count }))
    .sort((a, b) => a.point - b.point);
};
export const getUserPointCounts = (
  mergedProblems: Map<ProblemId, MergedProblem>,
  submissions: Submission[]
) => {
  const acceptedSubmissions = submissions.filter((s) => isAccepted(s.result));
  const acByUserId = groupBy(acceptedSubmissions, (s) => s.user_id);
  return Array.from(acByUserId.entries())
    .map(([userId, userSubmissions]) => {
      const problemIds = new Set(userSubmissions.map((s) => s.problem_id));
      const countByPoint = countBy(
        Array.from(problemIds),
        (problemId) => mergedProblems.get(problemId)?.point
      );
      return { userId, countByPoint };
    })
    .sort((a, b) => a.userId.localeCompare(b.userId));
};

export const SmallTable: React.FC<Props> = ({
  submissions,
  mergedProblems,
  setFilterFunc,
}) => {
  const userPointCountMap = getUserPointCounts(mergedProblems, submissions);
  const totalCount = getTotalCount(mergedProblems);
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
        {userPointCountMap.map(({ userId, countByPoint }) => (
          <tr key={userId}>
            <td>{userId}</td>
            {totalCount.map(({ point, count }) => (
              <td
                key={point}
                className={
                  countByPoint.get(point) === count
                    ? TableColor.Success
                    : TableColor.None
                }
              >
                {countByPoint.get(point) ?? 0}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
};
