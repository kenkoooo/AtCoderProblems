import React, { useState } from "react";
import { Tooltip } from "reactstrap";
import { useRatingInfo } from "../api/APIClient";
import { getRatingColor, getRatingColorClass } from "../utils";
import * as Url from "../utils/Url";
import { TopcoderLikeCircle } from "./TopcoderLikeCircle";
import { NewTabLink } from "./NewTabLink";

interface Props {
  userId: string;
  big?: boolean;
  showRating?: boolean;
}

const ColoredUserNameLabel = (props: Props) => {
  const { userId } = props;
  const userRatingInfo = useRatingInfo(userId);
  const userRating = userRatingInfo.rating;
  const color =
    userRating < 3200
      ? getRatingColor(userRating)
      : userRating < 3600
      ? "Silver"
      : "Gold";
  const id = "RatingCircle-" + userId;
  const [tooltipOpen, setTooltipOpen] = useState(false);

  return (
    <span className={`${getRatingColorClass(userRating)} text-nowrap`}>
      <TopcoderLikeCircle
        className="rating-circle"
        id={id}
        color={color}
        rating={userRating}
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
      &nbsp;
      <NewTabLink
        href={Url.formatUserUrl(userId)}
        className={getRatingColorClass(userRating)}
      >
        {userId}
      </NewTabLink>
    </span>
  );
};

export const UserNameLabel: React.FC<Props> = (props) => {
  const label = props.showRating ? (
    <ColoredUserNameLabel {...props} />
  ) : (
    <NewTabLink href={Url.formatUserUrl(props.userId)}>
      {props.userId}
    </NewTabLink>
  );
  return props.big ? <h1>{label}</h1> : label;
};
