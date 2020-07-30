import { RatingColor } from "./index";

const RatingMetalColors = ["Bronze", "Silver", "Gold"] as const;
export type RatingMetalColor = typeof RatingMetalColors[number];
export const getRatingMetalColorCodes = (metalColor: RatingMetalColor) => {
  switch (metalColor) {
    case "Bronze":
      return { base: "#965C2C", highlight: "#FFDABD" };
    case "Silver":
      return { base: "#808080", highlight: "white" };
    case "Gold":
      return { base: "#FFD700", highlight: "white" };
  }
};

export type RatingColorWithMetal = RatingColor | RatingMetalColor;
export const isRatingMetalColor = (
  color: RatingColorWithMetal
): color is RatingMetalColor => {
  return color === "Bronze" || color === "Silver" || color === "Gold";
};
