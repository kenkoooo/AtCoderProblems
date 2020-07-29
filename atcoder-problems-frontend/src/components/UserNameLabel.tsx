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
    return (
      <span className={getRatingColorClass(userRating)}>
        <RatingCircle userId={userId} userRating={userRating} big={props.big} />
        &nbsp;
        {userId}
      </span>
    );
  }
};
