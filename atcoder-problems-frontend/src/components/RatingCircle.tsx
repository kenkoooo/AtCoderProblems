import React, { useState } from "react";
import { Tooltip } from "reactstrap";
import { Theme } from "../style/theme";
import { getRatingColor, getRatingColorCode } from "../utils";
import { useTheme } from "./ThemeProvider";

function getColor(rating: number, theme: Theme): string {
  if (rating >= 3200) {
    if (rating < 3600) {
      // silver
      return "#808080";
    } else {
      // gold
      return "#ffd700";
    }
  } else {
    return getRatingColorCode(getRatingColor(rating), theme);
  }
}

interface Props {
  userId: string;
  userRating: number;
  large?: boolean;
}

export const RatingCircle: React.FC<Props> = (props) => {
  const { userId, userRating } = props;

  const theme = useTheme();
  const color: string = getColor(userRating, theme);
  const fillRatio: number = userRating >= 3200 ? 1.0 : (userRating % 400) / 400;
  const styleOptions = Object({
    borderColor: color,
    background:
      userRating < 3200
        ? `linear-gradient(to top, \
        ${color} 0%, ${color} ${fillRatio * 100}%, \
         rgba(0, 0, 0, ${0.0}) ${fillRatio * 100}%, rgba(0, 0, 0, ${0.0}) 100%)`
        : userRating < 3600
        ? `linear-gradient(to right, ${color}, #FFDABD, ${color})`
        : `linear-gradient(to right, ${color}, white, ${color})`,
  });

  const id = "RatingCircle-" + userId;
  const [tooltipOpen, setTooltipOpen] = useState(false);

  return (
    <>
      <span
        className={`rating-circle${props.large ? " rating-circle-large" : ""}`}
        style={styleOptions}
        id={id}
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
