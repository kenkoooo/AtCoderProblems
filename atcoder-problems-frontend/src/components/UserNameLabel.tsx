import React, { useState } from "react";
import { Tooltip } from "reactstrap";
import { getRatingColor, getRatingColorClass } from "../utils";
import { TopcoderLikeCircle } from "./TopcoderLikeCircle";

interface Props {
  userId: string;
  userRating: number;
}

export const UserNameLabel: React.FC<Props> = (props) => {
  const { userId, userRating } = props;
  const color =
    userRating < 3200
      ? getRatingColor(userRating)
      : userRating < 3600
      ? "Silver"
      : "Gold";
  const id = "RatingCircle-" + userId;
  const [tooltipOpen, setTooltipOpen] = useState(false);

  return (
    <span className={getRatingColorClass(userRating)}>
      <TopcoderLikeCircle
        className="rating-circle"
        id={id}
        color={color}
        rating={userRating}
        big
      />
      <Tooltip
        placement="top"
        target={id}
        isOpen={tooltipOpen}
        toggle={(): void => setTooltipOpen(!tooltipOpen)}
      >
        {`Rating: ${userRating}`}
      </Tooltip>
      &nbsp;
      {userId}
    </span>
  );
};
