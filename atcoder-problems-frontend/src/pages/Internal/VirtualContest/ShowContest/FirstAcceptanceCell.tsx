import React from "react";
import { UserId } from "../../../../interfaces/Status";
import { formatDuration } from "../../../../utils/DateUtil";
import { UserNameLabel } from "../../../../components/UserNameLabel";

export interface FirstAcceptance {
  userId: UserId;
  time: number;
}

interface FirstAcceptanceCellProps {
  fastest?: FirstAcceptance;
  showRating: boolean;
}

export const FirstAcceptanceCell: React.FC<FirstAcceptanceCellProps> = (
  props
) => {
  const { fastest, showRating } = props;

  if (fastest) {
    return (
      <td>
        <p className="font-weight-bold m-0 text-center">
          <UserNameLabel userId={fastest.userId} showRating={showRating} />
          <br />
          <span style={{ color: "gray" }}>{formatDuration(fastest.time)}</span>
        </p>
      </td>
    );
  } else {
    return (
      <td>
        <p className="m-0 text-center">
          <span>-</span>
        </p>
      </td>
    );
  }
};
