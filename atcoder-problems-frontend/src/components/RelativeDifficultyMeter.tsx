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

// const LEVEL_NAMES = ["Easy", "Moderate", "Devotion", "Difficult"];
const LEVEL_SECTIONS = [1, 3 / 4, 1 / 3, 1 / 6, 0];

const DifficultyLevel = {
  Easy: 0,
  Moderate: 1,
  Devotion: 2,
  Difficult: 3,
} as const;
type DifficultyLevel = typeof DifficultyLevel[keyof typeof DifficultyLevel];
const IdToLevel: Array<DifficultyLevel> = [
  DifficultyLevel.Easy,
  DifficultyLevel.Moderate,
  DifficultyLevel.Devotion,
  DifficultyLevel.Difficult,
];

const getDifficultyLevel = (solveProbability: number): DifficultyLevel => {
  for (let i = 0; i < 4; i++) {
    if (
      LEVEL_SECTIONS[i] >= solveProbability &&
      solveProbability > LEVEL_SECTIONS[i + 1]
    ) {
      return IdToLevel[i];
    }
  }
  return DifficultyLevel.Difficult; // Expect unreachable
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
    case DifficultyLevel.Devotion:
      return theme.relativeDifficultyDevotionColor;
    case DifficultyLevel.Difficult:
      return theme.relativeDifficultyDifficultColor;
    default:
      return theme.relativeDifficultyBackgroundColor;
  }
};

const rgbStyle = (r: number, g: number, b: number, ratio: number) =>
  `rgb(${r}, ${g}, ${b}) ${ratio * 100}%`;

export const RelativeDifficultyMeter: React.FC<Props> = (props) => {
  const { id, problemModel, userInternalRating } = props;

  const predictedSolveProbability = predictSolveProbability(
    problemModel,
    userInternalRating
  );
  const difficultyLevel = getDifficultyLevel(predictedSolveProbability);
  const fillRatio = 1 - predictedSolveProbability;

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
