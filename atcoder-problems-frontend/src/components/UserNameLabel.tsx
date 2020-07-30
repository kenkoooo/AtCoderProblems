import React from "react";
import { getRatingColorClass } from "../utils";
import { RatingCircle } from "./RatingCircle";

interface Props {
  userId: string;
  userRating: number;
}

export const UserNameLabel: React.FC<Props> = (props) => {
  const { userId, userRating } = props;

  return (
    <span className={getRatingColorClass(userRating)}>
      <RatingCircle userId={userId} userRating={userRating} big />
      &nbsp;
      {userId}
    </span>
  );
};
