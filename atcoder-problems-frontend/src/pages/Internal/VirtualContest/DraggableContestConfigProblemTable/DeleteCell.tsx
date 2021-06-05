import React from "react";
import { Button } from "reactstrap";
import { VirtualContestItem } from "../../types";

interface DeleteCellProps {
  problemId: string;
  problemSet: VirtualContestItem[];
  setProblemSet: (newProblemSet: VirtualContestItem[]) => void;
}
export const DeleteCell: React.FC<DeleteCellProps> = ({
  problemId,
  problemSet,
  setProblemSet,
}) => {
  return (
    <td style={{ width: "5px" }}>
      <Button
        close
        onClick={(): void => {
          setProblemSet(problemSet.filter((x) => x.id !== problemId));
        }}
      />
    </td>
  );
};
