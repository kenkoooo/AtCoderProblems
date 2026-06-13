import React from "react";
import { ProblemId, UserId } from "../../../../interfaces/Status";
import { ReducedProblemResult } from "./ResultCalcUtil";
import { FirstAcceptance, FirstAcceptanceCell } from "./FirstAcceptanceCell";

interface FirstAcceptanceRowProps {
  start: number;
  userIds: UserId[];
  problemIds: string[];
  resultsByUser: Map<UserId, Map<ProblemId, ReducedProblemResult>>;
  showRating: boolean;
}

export const FirstAcceptanceRow: React.FC<FirstAcceptanceRowProps> = (
  props
) => {
  const { start, userIds, problemIds, resultsByUser, showRating } = props;

  const fastestByProblem = new Map<ProblemId, FirstAcceptance>();

  resultsByUser.forEach((resultsByProblemId, userId) => {
    if (!userIds.includes(userId)) {
      return;
    }

    resultsByProblemId.forEach((result, problemId) => {
      if (!result.accepted) {
        return;
      }

      const currentFastest = fastestByProblem.get(problemId);
      const time = result.lastUpdatedEpochSecond - start;
      if (!currentFastest || currentFastest.time > time) {
        const newFastest: FirstAcceptance = {
          userId: userId,
          time: time,
        };
        fastestByProblem.set(problemId, newFastest);
      }
    });
  });

  return (
    <tr>
      <th colSpan={3} className="text-center align-middle">
        First Acceptance
      </th>
      {problemIds.map((problemId) => {
        return (
          <FirstAcceptanceCell
            key={problemId}
            fastest={fastestByProblem.get(problemId)}
            showRating={showRating}
          />
        );
      })}
    </tr>
  );
};
