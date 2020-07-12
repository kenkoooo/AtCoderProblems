import React, { useState } from "react";
import { Tooltip } from "reactstrap";
import { predictSolveProbability } from "../utils/ProblemModelUtil";
import { ProblemModelWithDifficultyModel } from "../interfaces/ProblemModel";
import { Theme } from "../style/theme";
import { useTheme } from "./ThemeProvider";

interface Props {
  id: string;
  problemModel: ProblemModelWithDifficultyModel;
  userInternalRating: number;
}

// const LEVEL_NAMES = ["Easy", "Moderate", "Difficult"];
const LEVEL_SECTION = 1 / 4;

const DifficultyLevel = {
  Easy: 0,
  Moderate: 1,
  Difficult: 2,
} as const;
type DifficultyLevel = typeof DifficultyLevel[keyof typeof DifficultyLevel];

const getDifficultyLevel = (
  relativeDifficultyRatio: number
): DifficultyLevel => {
  if (relativeDifficultyRatio <= LEVEL_SECTION) return DifficultyLevel.Easy;
  else if (relativeDifficultyRatio <= 1 - LEVEL_SECTION)
    return DifficultyLevel.Moderate;
  else return DifficultyLevel.Difficult;
};

const getFillRatio = (
  relativeDifficultyRatio: number,
  level: DifficultyLevel
) => {
  switch (level) {
    case DifficultyLevel.Easy:
      return relativeDifficultyRatio / LEVEL_SECTION;
    case DifficultyLevel.Moderate:
      return (relativeDifficultyRatio - LEVEL_SECTION) / (LEVEL_SECTION * 2);
    case DifficultyLevel.Difficult:
      return (relativeDifficultyRatio - LEVEL_SECTION * 3) / LEVEL_SECTION;
    default:
      return 0;
  }
};

const getRGB = (code: string) => {
  const r = parseInt(code.slice(1, 3), 16);
  const g = parseInt(code.slice(3, 5), 16);
  const b = parseInt(code.slice(5, 7), 16);
  return [r, g, b];
};

const getLevelColor = (level: DifficultyLevel, theme: Theme) => {
  switch (level) {
    case DifficultyLevel.Easy:
      return theme.relativeDifficultyEasyColor;
    case DifficultyLevel.Moderate:
      return theme.relativeDifficultyModerateColor;
    case DifficultyLevel.Difficult:
      return theme.relativeDifficultyDifficultColor;
    default:
      return theme.relativeDifficultyBackgroundColor;
  }
};

const rgbStyle = (r: number, g: number, b: number, ratio: number) =>
  `rgb(${r}, ${g}, ${b}) ${ratio * 100}%`;

const RelativeDifficultyMeter: React.FC<Props> = (props) => {
  const { id, problemModel, userInternalRating } = props;

  const predictedSolveProbability = predictSolveProbability(
    problemModel,
    userInternalRating
  );
  const relativeDifficultyRatio = 1 - predictedSolveProbability;
  const difficultyLevel = getDifficultyLevel(relativeDifficultyRatio);
  const fillRatio = getFillRatio(relativeDifficultyRatio, difficultyLevel);

  const theme = useTheme();
  const color = getLevelColor(difficultyLevel, theme);
  const [r, g, b] = getRGB(color);
  const [bg_r, bg_g, bg_b] = getRGB(theme.relativeDifficultyBackgroundColor);

  const styleOptions = Object({
    borderColor: color,
    background: `linear-gradient(to right, ${[
      rgbStyle(r, g, b, 0),
      rgbStyle(r, g, b, fillRatio),
      rgbStyle(bg_r, bg_g, bg_b, fillRatio),
      rgbStyle(bg_r, bg_g, bg_b, 1),
    ].join(", ")})`,
  });
  const description = `Predicted Solve Probability of User: ${Math.round(
    predictedSolveProbability * 100
  )}%`;
  const iconId = `RelativeDifficultyIcon-${id}`;
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const toggleTooltipState = (): void => setTooltipOpen(!tooltipOpen);

  return (
    <>
      <div
        className="relative-difficulty-meter"
        style={styleOptions}
        id={iconId}
      />
      <Tooltip
        placement="top"
        target={iconId}
        isOpen={tooltipOpen}
        toggle={toggleTooltipState}
      >
        {description}
      </Tooltip>
    </>
  );
};

export default RelativeDifficultyMeter;
