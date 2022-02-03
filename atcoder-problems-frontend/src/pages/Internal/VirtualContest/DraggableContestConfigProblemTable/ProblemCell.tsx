import React from "react";
import { ProblemLink } from "../../../../components/ProblemLink";
import Problem from "../../../../interfaces/Problem";
import ProblemModel from "../../../../interfaces/ProblemModel";
import { ProblemId } from "../../../../interfaces/Status";

interface ProblemCellProps {
  problemId: ProblemId;
  problem?: Problem;
  problemModel?: ProblemModel;
  solvedUsers?: string[];
}
export const ProblemCell: React.FC<ProblemCellProps> = ({
  problemId,
  problem,
  problemModel,
  solvedUsers,
}): React.ReactElement => {
  return (
    <td style={{ width: "40%" }}>
      {problem ? (
        <ProblemLink
          problemId={problem.id}
          contestId={problem.contest_id}
          problemIndex={problem.problem_index}
          problemName={problem.name}
          showDifficulty={true}
          problemModel={problemModel}
          isExperimentalDifficulty={problemModel?.is_experimental}
        />
      ) : (
        problemId
      )}
      {solvedUsers && solvedUsers.length > 0 && (
        <> solved by {solvedUsers.join(", ")}</>
      )}
    </td>
  );
};
