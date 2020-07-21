import React from "react";
import { ProblemId } from "../../../../interfaces/Status";
import { clipDifficulty, getRatingColorClass } from "../../../../utils";
import { compareProblem } from "./ContestTable";
import { ReducedProblemResult, UserTotalResult } from "./ResultCalcUtil";
import { ScoreCell } from "./ScoreCell";

const EstimatedPerformance: React.FC<{
  estimatedPerformance: number | undefined;
}> = (props) => {
  if (props.estimatedPerformance === undefined) {
    return null;
  }
  return (
    <p
      className={getRatingColorClass(props.estimatedPerformance)}
      style={{ textAlign: "center", fontWeight: "bold" }}
    >
      {clipDifficulty(props.estimatedPerformance)}
    </p>
  );
};

interface ContestTableRowProps {
  userId: string;
  rank: number;
  items: {
    id: string;
    point: number | null;
    order: number | null;
    contestId?: string;
    title?: string;
  }[];
  start: number;
  penaltySecond: number;
  showProblems: boolean;
  estimatedPerformance?: number;
  reducedProblemResults: Map<ProblemId, ReducedProblemResult>;
  userTotalResult?: UserTotalResult;
}

export const ContestTableRow: React.FC<ContestTableRowProps> = (props) => {
  const {
    rank,
    userId,
    showProblems,
    items,
    start,
    penaltySecond,
    reducedProblemResults,
    userTotalResult,
    estimatedPerformance,
  } = props;

  const totalTime = userTotalResult
    ? userTotalResult.lastUpdatedEpochSecond +
      penaltySecond * userTotalResult.penalties -
      start
    : 0;

  return (
    <tr>
      <th>{rank + 1}</th>
      <th>{userId}</th>
      {!showProblems
        ? null
        : items.sort(compareProblem).map((problem) => {
            const result = reducedProblemResults.get(problem.id);
            if (!result) {
              return (
                <td key={problem.id} style={{ textAlign: "center" }}>
                  -
                </td>
              );
            }

            const trials = result.accepted ? result.penalties : result.trials;
            const point = result.point;
            const time = result.lastUpdatedEpochSecond - start;

            return (
              <td key={problem.id}>
                <ScoreCell trials={trials} maxPoint={point} time={time} />
              </td>
            );
          })}
      <td>
        <ScoreCell
          trials={userTotalResult?.penalties ?? 0}
          maxPoint={userTotalResult?.point ?? 0}
          time={totalTime}
        />
      </td>
      {estimatedPerformance !== undefined && (
        <td>
          <EstimatedPerformance estimatedPerformance={estimatedPerformance} />
        </td>
      )}
    </tr>
  );
};
