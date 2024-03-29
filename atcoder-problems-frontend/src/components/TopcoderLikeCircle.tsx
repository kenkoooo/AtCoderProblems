import React from "react";
import { Theme } from "../style/theme";
import { getRatingColorCode, RatingColor } from "../utils";
import { useTheme } from "./ThemeProvider";

type RatingMetalColor = "Bronze" | "Silver" | "Gold";
const getRatingMetalColorCode = (metalColor: RatingMetalColor) => {
  switch (metalColor) {
    case "Bronze":
      return { base: "#965C2C", highlight: "#FFDABD" };
    case "Silver":
      return { base: "#808080", highlight: "white" };
    case "Gold":
      return { base: "#FFD700", highlight: "white" };
  }
};

type RatingColorWithMetal = RatingColor | RatingMetalColor;
const getStyleOptions = (
  color: RatingColorWithMetal,
  fillRatio: number,
  theme: Theme
) => {
  if (color === "Bronze" || color === "Silver" || color === "Gold") {
    const metalColor = getRatingMetalColorCode(color);
    return {
      borderColor: metalColor.base,
      background: `linear-gradient(to right, \
        ${metalColor.base}, ${metalColor.highlight}, ${metalColor.base})`,
    };
  } else {
    const colorCode = getRatingColorCode(color, theme);
    return {
      borderColor: colorCode,
      background: `border-box linear-gradient(to top, \
        ${colorCode} ${fillRatio * 100}%, \
        rgba(0,0,0,0) ${fillRatio * 100}%)`,
    };
  }
};

interface Props extends React.HTMLAttributes<HTMLElement> {
  color: RatingColorWithMetal;
  rating: number;
  big?: boolean;
}

export const TopcoderLikeCircle: React.FC<Props> = (props) => {
  const { color, rating } = props;
  const fillRatio = rating >= 3200 ? 1.0 : (rating % 400) / 400;
  const className = `topcoder-like-circle \
    ${props.big ? "topcoder-like-circle-big" : ""}`;
  const theme = useTheme();
  const styleOptions = getStyleOptions(color, fillRatio, theme);
  return (
    <span
      className={`${className} ${props.className ?? ""}`}
      id={props.id}
      style={styleOptions}
    />
  );
};
