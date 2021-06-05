import React from "react";
import { Button } from "reactstrap";

interface DeleteCellProps {
  onDelete: () => void;
}
export const DeleteCell: React.FC<DeleteCellProps> = ({ onDelete }) => {
  return (
    <td style={{ width: "5px" }}>
      <Button close onClick={onDelete} />
    </td>
  );
};
