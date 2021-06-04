import React from "react";
import { isProblemModelWithDifficultyModel } from "../../../../interfaces/ProblemModel";
import { ProblemRowData } from "./index";

type DifficultyCellProps = Pick<ProblemRowData, "problemModel">;
export const DifficultyCell: React.FC<DifficultyCellProps> = ({
  problemModel,
}) => {
  return (
    <td style={{ width: "10%" }}>
      {!isProblemModelWithDifficultyModel(problemModel) ? (
        <>-</>
      ) : (
        <>{problemModel.difficulty}</>
      )}
    </td>
  );
};
