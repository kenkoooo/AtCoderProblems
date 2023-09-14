import React, { useState } from "react";
import { Table, Button, ButtonGroup } from "reactstrap";
import { ProblemId } from "../../interfaces/Status";
import { isAccepted } from "../../utils";
import { countBy, groupBy } from "../../utils/GroupBy";
import { TableColor } from "../../utils/TableColor";
import Submission from "../../interfaces/Submission";
import MergedProblem from "../../interfaces/MergedProblem";
import { useMergedProblemMap } from "../../api/APIClient";

interface Props {
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

export const SmallTable: React.FC<Props> = ({ submissions, setFilterFunc }) => {
  const [grouped, setGrouped] = useState(true);
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

  const binarySearch = (
    arr: { point: number; count: number }[],
    target: number
  ) => {
    let left = 0;
    let right = arr.length;
    while (right - left > 1) {
      const mid = Math.floor((left + right) / 2);
      if (arr[mid].point <= target) {
        left = mid;
      } else {
        right = mid;
      }
    }
    return left;
  };

  const getUserPointCountInArea = (
    countByPoint: Map<number | null | undefined, number>,
    pointStart: number,
    pointEnd: number
  ) => {
    let ret = 0;
    for (
      let i = binarySearch(totalCount, pointStart);
      i < totalCount.length;
      i++
    ) {
      if (totalCount[i].point >= pointEnd) {
        break;
      }
      ret += countByPoint.get(totalCount[i].point) ?? 0;
    }
    return ret;
  };

  return (
    <>
      <ButtonGroup className="mb-2">
        <Button onClick={(): void => setGrouped(!grouped)}>
          {grouped ? "Grouped" : "All"}
        </Button>
      </ButtonGroup>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Point</th>
            {(grouped ? totalCountBy100 : totalCount).map(({ point }) => (
              <th key={point}>
                <a
                  href={window.location.hash}
                  onClick={(): void => setFilterFunc(point)}
                >
                  {grouped ? `${point}-` : point}
                </a>
              </th>
            ))}
          </tr>
          <tr>
            <th>Total</th>
            {(grouped ? totalCountBy100 : totalCount).map(
              ({ point, count }) => (
                <th key={point}>{count}</th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {userPointCountMap.map(({ userId, countByPoint }) => (
            <tr key={userId}>
              <td>{userId}</td>
              {(grouped ? totalCountBy100 : totalCount).map(
                ({ point, count }) => (
                  <td
                    key={point}
                    className={
                      (grouped
                        ? getUserPointCountInArea(
                            countByPoint,
                            point,
                            point + 100
                          )
                        : countByPoint.get(point)) === count
                        ? TableColor.Success
                        : TableColor.None
                    }
                  >
                    {(grouped
                      ? getUserPointCountInArea(
                          countByPoint,
                          point,
                          point + 100
                        )
                      : countByPoint.get(point)) ?? 0}
                  </td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
};
