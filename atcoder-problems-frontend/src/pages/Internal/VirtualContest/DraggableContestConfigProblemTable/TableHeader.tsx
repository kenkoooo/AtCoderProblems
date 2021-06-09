import React from "react";
import { VirtualContestItem } from "../../types";

interface TableHeaderProps {
  text: string;
  compare?: (a: VirtualContestItem, b: VirtualContestItem) => number;
  problemSet: VirtualContestItem[];
  setProblemSet: (newProblemSet: VirtualContestItem[]) => void;
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  text,
  compare,
  problemSet,
  setProblemSet,
}) => {
  const [order, setOrder] = React.useState<number>(1);
  return (
    <th
      style={{ cursor: compare ? "pointer" : "" }}
      onClick={() => {
        if (!compare) {
          return;
        }
        const newProblemSet = [...problemSet];
        newProblemSet.sort(
          (a: VirtualContestItem, b: VirtualContestItem): number => {
            return compare(a, b) * order;
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
