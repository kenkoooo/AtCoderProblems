import React from "react";
import ProblemModel, {
  isProblemModelWithDifficultyModel,
} from "../../../../interfaces/ProblemModel";

interface DifficultyCellProps {
  problemModel?: ProblemModel;
}
export const DifficultyCell: React.FC<DifficultyCellProps> = ({
  problemModel,
}) => {
  return (
    <td style={{ width: "10%" }}>
      {isProblemModelWithDifficultyModel(problemModel) ? (
        <>{problemModel.difficulty}</>
      ) : (
        <>-</>
      )}
    </td>
  );
};
