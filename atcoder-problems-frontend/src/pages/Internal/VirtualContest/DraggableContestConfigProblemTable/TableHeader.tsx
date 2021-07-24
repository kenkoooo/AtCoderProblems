import React from "react";
import { FaSort, FaSortAmountDownAlt, FaSortAmountDown } from "react-icons/fa";
import { VirtualContestItem } from "../../types";

interface TableHeaderProps {
  text: string;
  compare?: (a: VirtualContestItem, b: VirtualContestItem) => number;
  problemSet: VirtualContestItem[];
  setProblemSet: (newProblemSet: VirtualContestItem[]) => void;
  isSorted: boolean;
  setSortedColumn: (column: string) => void;
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  text,
  compare,
  problemSet,
  setProblemSet,
  isSorted,
  setSortedColumn,
}) => {
  const [order, setOrder] = React.useState<number>(1);

  const decideSortIcon = (order: number, isSorted: boolean) => {
    if (!isSorted) {
      return <FaSort />;
    }
    if (order === 1) {
      return <FaSortAmountDown />;
    } else {
      return <FaSortAmountDownAlt />;
    }
  };

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
        setSortedColumn(text);
      }}
    >
      {text}
      <div className="float-right">
        {compare && decideSortIcon(order, isSorted)}
      </div>
    </th>
  );
};
