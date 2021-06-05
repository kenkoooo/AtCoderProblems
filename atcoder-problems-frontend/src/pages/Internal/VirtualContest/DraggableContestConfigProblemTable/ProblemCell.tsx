import React from "react";
import { ProblemLink } from "../../../../components/ProblemLink";
import { ProblemRowData } from "./index";

type ProblemCellProps = Pick<
  ProblemRowData,
  "id" | "problem" | "problemModel" | "solvedUsers"
>;
export const ProblemCell: React.FC<ProblemCellProps> = ({
  id,
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
          problemTitle={problem.title}
          showDifficulty={true}
          problemModel={problemModel}
          isExperimentalDifficulty={problemModel?.is_experimental}
        />
      ) : (
        id
      )}
      {solvedUsers && solvedUsers.length > 0 && (
        <> solved by {solvedUsers.join(", ")}</>
      )}
    </td>
  );
};
