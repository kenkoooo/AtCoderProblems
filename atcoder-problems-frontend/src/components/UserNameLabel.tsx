import React from "react";
import { getRatingColorClass } from "../utils";
import { RatingCircle } from "./RatingCircle";

interface Props {
  userId: string;
  userRating?: number;
  showRatingCircle?: boolean;
  big?: boolean;
}

export const UserNameLabel: React.FC<Props> = (props) => {
  const { userId, userRating, showRatingCircle } = props;

  if (!(showRatingCircle && userRating)) {
    return <>{userId}</>;
  } else {
    const className = `user-name-label \
      ${props.big ? "user-name-label-big" : ""} \
      ${getRatingColorClass(userRating)}`;
    return (
      <span className={className}>
        <RatingCircle userId={userId} userRating={userRating} big={props.big} />
        {userId}
      </span>
    );
  }
};
