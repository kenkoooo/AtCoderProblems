import React from "react";
import { Table } from "reactstrap";
import { ProblemId } from "../../interfaces/Status";
import { isAccepted } from "../../utils";
import { countBy, groupBy } from "../../utils/GroupBy";
import { TableColor } from "../../utils/TableColor";
import Submission from "../../interfaces/Submission";
import MergedProblem from "../../interfaces/MergedProblem";
import { useMergedProblemMap } from "../../api/APIClient";

interface Props {
  submissions: Submission[];
  setFilterFunc: (from: number, to: number) => void;
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

export const SmallTable: React.FC<Props> = ({ submissions, setFilterFunc }) => {
  const mergedProblemMap =
    useMergedProblemMap().data ?? new Map<ProblemId, MergedProblem>();
  const userPointCountMap = getUserPointCounts(mergedProblemMap, submissions);
  const totalCount = getTotalCount(mergedProblemMap);
  const totalCountBy100 = totalCount.reduce(
    (
      ret: { point: number; count: number }[],
      current: { point: number; count: number }
    ) => {
      const roundedPoint = Math.floor(current.point / 100) * 100;
      const prev = ret.find((entry) => entry.point === roundedPoint);
      if (prev) {
        prev.count += current.count;
      } else {
        ret.push({ point: roundedPoint, count: current.count });
      }
      return ret;
    },
    []
  );

  const getUserPointCountInArea = (
    countByPoint: Map<number | null | undefined, number>,
    pointStart: number,
    pointEnd: number
  ) => {
    let ret = 0;
    for (let i = 0; i < totalCount.length; i++) {
      if (totalCount[i].point < pointStart) {
        continue;
      }
      if (totalCount[i].point >= pointEnd) {
        break;
      }
      ret += countByPoint.get(totalCount[i].point) ?? 0;
    }
    return ret;
  };

  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>Point</th>
          {totalCountBy100.map(({ point }) => (
            <th key={point}>
              <a
                href={window.location.hash}
                onClick={(): void => setFilterFunc(point, point + 99)}
              >
                {`${point}-`}
              </a>
            </th>
          ))}
        </tr>
        <tr>
          <th>Total</th>
          {totalCountBy100.map(({ point, count }) => (
            <th key={point}>{count}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {userPointCountMap.map(({ userId, countByPoint }) => (
          <tr key={userId}>
            <td>{userId}</td>
            {totalCountBy100.map(({ point, count }) => (
              <td
                key={point}
                className={
                  getUserPointCountInArea(countByPoint, point, point + 100) ===
                  count
                    ? TableColor.Success
                    : TableColor.None
                }
              >
                {getUserPointCountInArea(countByPoint, point, point + 100) ?? 0}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
};
