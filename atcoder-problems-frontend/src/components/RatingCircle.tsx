import React, { useState } from "react";
import { Tooltip } from "reactstrap";
import { CompletedRatingColor, getRatingColor } from "../utils";
import { TopcoderLikeCircle } from "./TopcoderLikeCircle";

function getColor(rating: number): CompletedRatingColor {
  if (rating >= 3200) {
    if (rating < 3600) {
      return "Silver";
    } else {
      return "Gold";
    }
  } else {
    return getRatingColor(rating);
  }
}

interface Props {
  userId: string;
  userRating: number;
  big?: boolean;
}

export const RatingCircle: React.FC<Props> = (props) => {
  const { userId, userRating } = props;

  const color = getColor(userRating);
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
