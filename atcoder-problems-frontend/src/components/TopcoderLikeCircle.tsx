import React from "react";
import { getRatingColorCode } from "../utils";
import {
  RatingColorWithMetal,
  getRatingMetalColorCodes,
  isRatingMetalColor,
} from "../utils/RatingMetalColor";
import { Theme } from "../style/theme";
import { useTheme } from "./ThemeProvider";

const getStyleOptions = (
  color: RatingColorWithMetal,
  fillRatio: number,
  theme: Theme
) => {
  if (isRatingMetalColor(color)) {
    const metalColor = getRatingMetalColorCodes(color);
    return Object({
      borderColor: metalColor.base,
      background: `linear-gradient(to right, \
        ${metalColor.base}, ${metalColor.highlight}, ${metalColor.base})`,
    });
  } else {
    const colorCode = getRatingColorCode(color, theme);
    return Object({
      borderColor: colorCode,
      background: `linear-gradient(to top, \
        ${colorCode} 0%, \
        ${colorCode} ${fillRatio * 100}%, \
        rgba(0,0,0,0) ${fillRatio * 100}%, \
        rgba(0,0,0,0) 100%)`,
    });
  }
};

interface Props extends React.HTMLAttributes<HTMLElement> {
  color: RatingColorWithMetal;
  fillRatio: number;
  big?: boolean;
}

export const TopcoderLikeCircle: React.FC<Props> = (props) => {
  const { color, fillRatio } = props;
  const className = `topcoder-like-circle \
    ${props.big ? "topcoder-like-circle-big" : ""}`;
  const theme = useTheme();
  const styleOptions = getStyleOptions(color, fillRatio, theme);
  return (
    <span
      className={`${className} ${props.className}`}
      id={props.id}
      style={styleOptions}
    />
  );
};
