import React, { useState } from "react";
import { Tooltip } from "reactstrap";
import { getRatingColor } from "../utils";
import { TopcoderLikeCircle } from "./TopcoderLikeCircle";

interface Props {
  userId: string;
  userRating: number;
  big?: boolean;
}

export const RatingCircle: React.FC<Props> = (props) => {
  const { userId, userRating } = props;

  const color =
    userRating < 3200
      ? getRatingColor(userRating)
      : userRating < 3600
      ? "Silver"
      : "Gold";
  const fillRatio = userRating >= 3200 ? 1.0 : (userRating % 400) / 400;
  const id = "RatingCircle-" + userId;
  const [tooltipOpen, setTooltipOpen] = useState(false);

  return (
    <>
      <TopcoderLikeCircle
        className="rating-circle"
        id={id}
        color={color}
        fillRatio={fillRatio}
        big={props.big}
      />
      <Tooltip
        placement="top"
        target={id}
        isOpen={tooltipOpen}
        toggle={(): void => setTooltipOpen(!tooltipOpen)}
      >
        {`Rating: ${userRating}`}
      </Tooltip>
    </>
  );
};
