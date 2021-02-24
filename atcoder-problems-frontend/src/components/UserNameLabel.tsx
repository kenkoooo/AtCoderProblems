import React, { useState } from "react";
import { Tooltip } from "reactstrap";
import { connect, PromiseState } from "react-refetch";
import { getRatingColor, getRatingColorClass } from "../utils";
import { RatingInfo } from "../utils/RatingInfo";
import * as CachedApiClient from "../utils/CachedApiClient";
import * as Url from "../utils/Url";
import { TopcoderLikeCircle } from "./TopcoderLikeCircle";
import { NewTabLink } from "./NewTabLink";

interface OuterProps {
  userId: string;
  big?: boolean;
  showRating?: boolean;
}

interface InnerProps extends OuterProps {
  userRatingInfoFetch: PromiseState<RatingInfo>;
}

const InnerColoredUserNameLabel: React.FC<InnerProps> = (props) => {
  const { userId, userRatingInfoFetch } = props;
  const userRating = userRatingInfoFetch.fulfilled
    ? userRatingInfoFetch.value.rating
    : 0;
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

const ColoredUserNameLabel = connect<OuterProps, InnerProps>(({ userId }) => ({
  userRatingInfoFetch: {
    comparison: userId,
    value: (): Promise<RatingInfo> => CachedApiClient.cachedRatingInfo(userId),
  },
}))(InnerColoredUserNameLabel);

export const UserNameLabel: React.FC<OuterProps> = (props) => {
  const label = props.showRating ? (
    <ColoredUserNameLabel {...props} />
  ) : (
    <NewTabLink href={Url.formatUserUrl(props.userId)}>
      {props.userId}
    </NewTabLink>
  );
  return props.big ? <h1>{label}</h1> : label;
};
