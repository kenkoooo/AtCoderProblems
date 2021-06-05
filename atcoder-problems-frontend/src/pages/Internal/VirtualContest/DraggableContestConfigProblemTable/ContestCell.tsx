import React from "react";
import { ContestLink } from "../../../../components/ContestLink";
import { ProblemRowData } from "./index";

type ContestCellProps = Pick<ProblemRowData, "contest">;
export const ContestCell: React.FC<ContestCellProps> = ({ contest }) => {
  return (
    <td style={{ width: "40%" }}>
      {contest ? <ContestLink contest={contest} /> : null}
    </td>
  );
};
