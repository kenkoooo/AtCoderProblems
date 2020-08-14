import React from "react";
import { ProblemId } from "../../../../interfaces/Status";
import { clipDifficulty, getRatingColorClass } from "../../../../utils";
import { UserNameLabel } from "../../../../components/UserNameLabel";
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
  tweetButton?: JSX.Element;
  userId: string;
  rank: number;
  sortedItems: {
    id: string;
    point: number | null;
    order: number | null;
    contestId?: string;
    title?: string;
  }[];
  start: number;
  penaltySecond: number;
  showRating: boolean;
  showProblems: boolean;
  estimatedPerformance?: number;
  reducedProblemResults: Map<ProblemId, ReducedProblemResult>;
  userTotalResult?: UserTotalResult;
}

export const ContestTableRow: React.FC<ContestTableRowProps> = (props) => {
  const {
    tweetButton,
    rank,
    userId,
    showRating,
    showProblems,
    sortedItems,
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
      <th className="text-center align-middle">{rank + 1}</th>
      <td className="text-left align-middle">
        <UserNameLabel userId={userId} showRating={showRating} />
        {tweetButton && <div className="text-right">{tweetButton}</div>}
      </td>
      {!showProblems
        ? null
        : sortedItems.map((problem) => {
            const result = reducedProblemResults.get(problem.id);
            if (!result) {
              return (
                <td key={problem.id} className="text-center">
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
        <td className="align-middle">
          <EstimatedPerformance estimatedPerformance={estimatedPerformance} />
        </td>
      )}
    </tr>
  );
};
