import React from "react";
import { Input, InputGroup } from "reactstrap";
import { ProblemRowData, Props } from "./index";

type PointCellProps = Pick<
  Props & ProblemRowData,
  "index" | "point" | "problemSet" | "setProblemSet"
>;
export const PointCell: React.FC<PointCellProps> = ({
  index,
  point,
  problemSet,
  setProblemSet,
}) => {
  const [editCell, setEditCell] = React.useState<boolean>(false);
  return (
    <td
      style={{ width: "10%" }}
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
