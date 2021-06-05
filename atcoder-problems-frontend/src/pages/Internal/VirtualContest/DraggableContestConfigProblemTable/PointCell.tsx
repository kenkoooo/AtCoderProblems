import React from "react";
import { Input, InputGroup } from "reactstrap";

interface PointCellProps {
  currentPoint: number | null;
  setProblemPoint: (point: number | null) => void;
}
export const PointCell: React.FC<PointCellProps> = ({
  currentPoint,
  setProblemPoint,
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
            defaultValue={currentPoint ? currentPoint : undefined}
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
              setProblemPoint(point);
            }}
          />
        </InputGroup>
      ) : (
        <>{currentPoint !== null ? <>{currentPoint}</> : <>-</>}</>
      )}
    </td>
  );
};
