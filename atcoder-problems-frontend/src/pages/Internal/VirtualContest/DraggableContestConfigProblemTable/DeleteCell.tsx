import React from "react";
import { Button } from "reactstrap";
import { VirtualContestItem } from "../../types";

interface DeleteCellProps {
  id: string;
  problemSet: VirtualContestItem[];
  setProblemSet: (newProblemSet: VirtualContestItem[]) => void;
}
export const DeleteCell: React.FC<DeleteCellProps> = ({
  id,
  problemSet,
  setProblemSet,
}) => {
  return (
    <td style={{ width: "5px" }}>
      <Button
        close
        onClick={(): void => {
          setProblemSet(problemSet.filter((x) => x.id !== id));
        }}
      />
    </td>
  );
};
