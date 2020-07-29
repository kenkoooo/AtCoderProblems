import React from "react";
import {
  CompletedRatingColor,
  getMetalHighlightColorCode,
  getRatingColorCode,
  getRatingMetalColorCode,
  isRatingMetalColor,
} from "../utils";
import { Theme } from "../style/theme";
import { useTheme } from "./ThemeProvider";

const getStyleOptions = (
  color: CompletedRatingColor,
  fillRatio: number,
  theme: Theme
) => {
  if (isRatingMetalColor(color)) {
    const colorCode = getRatingMetalColorCode(color);
    const highlightCode = getMetalHighlightColorCode(color);
    return Object({
      borderColor: colorCode,
      background: `linear-gradient(to right, \
        ${colorCode}, ${highlightCode}, ${colorCode})`,
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
  color: CompletedRatingColor;
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
    <div
      className={`${className} ${props.className}`}
      id={props.id}
      style={styleOptions}
    />
  );
};
