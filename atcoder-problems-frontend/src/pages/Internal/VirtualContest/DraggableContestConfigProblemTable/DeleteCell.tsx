import React from "react";
import { Button } from "reactstrap";
import { ProblemRowData, Props } from "./index";

type DeleteCellProps = Pick<
  Props & ProblemRowData,
  "id" | "problemSet" | "setProblemSet"
>;
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
