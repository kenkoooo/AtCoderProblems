import React from "react";
import { ContestLink } from "../../../../components/ContestLink";
import Contest from "../../../../interfaces/Contest";

interface ContestCellProps {
  contest?: Contest;
}
export const ContestCell: React.FC<ContestCellProps> = ({ contest }) => {
  return (
    <td style={{ width: "40%" }}>
      {contest && <ContestLink contest={contest} />}
    </td>
  );
};
