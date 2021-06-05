import React from "react";
import { Input, InputGroup } from "reactstrap";
import { VirtualContestItem } from "../../types";

interface PointCellProps {
  index: number;
  point: number | null;
  problemSet: VirtualContestItem[];
  setProblemSet: (newProblemSet: VirtualContestItem[]) => void;
}
export const PointCell: React.FC<PointCellProps> = ({
  index,
  point,
  problemSet,
  setProblemSet,
}) => {
  const [editCell, setEditCell] = React.useState<boolean>(false);
  const [mouseOver, setMouseOver] = React.useState<boolean>(false);
  return (
    <td
      onMouseOver={() => {
        setMouseOver(true);
      }}
      onMouseLeave={() => {
        setMouseOver(false);
      }}
      style={{
        width: "10%",
        backgroundColor: mouseOver && !editCell ? "darkgrey" : "",
      }}
      onClick={() => {
        setEditCell(true);
      }}
    >
      {editCell ? (
        <InputGroup size="sm">
          <Input
            type="number"
            autoFocus={true}
            defaultValue={point ? point : undefined}
            onBlur={() => {
              setEditCell(false);
            }}
            onKeyPress={(target) => {
              if (target.key == "Enter") {
                setEditCell(false);
              }
            }}
            onChange={(e): void => {
              const parse = parseInt(e.target.value, 10);
              const point = !isNaN(parse) ? parse : null;
              const newProblemSet = [...problemSet];
              newProblemSet[index] = {
                ...problemSet[index],
                point,
              };
              setProblemSet(newProblemSet);
            }}
          />
        </InputGroup>
      ) : (
        <>{point === null ? <>-</> : <>{point}</>}</>
      )}
    </td>
  );
};
