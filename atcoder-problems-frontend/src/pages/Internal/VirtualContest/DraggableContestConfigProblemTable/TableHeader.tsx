import React from "react";
import { VirtualContestItem } from "../../types";

interface TableHeaderProps {
  text: string;
  less?: (a: VirtualContestItem, b: VirtualContestItem) => number;
  problemSet: VirtualContestItem[];
  setProblemSet: (newProblemSet: VirtualContestItem[]) => void;
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  text,
  less,
  problemSet,
  setProblemSet,
}) => {
  const [order, setOrder] = React.useState<number>(1);
  return (
    <th
      style={{ cursor: less ? "pointer" : "" }}
      onClick={() => {
        if (!less) {
          return;
        }
        const newProblemSet = [...problemSet];
        newProblemSet.sort(
          (a: VirtualContestItem, b: VirtualContestItem): number => {
            return less(a, b) * order;
          }
        );
        setProblemSet(newProblemSet);
        setOrder(order * -1);
      }}
    >
      {text}
    </th>
  );
};
