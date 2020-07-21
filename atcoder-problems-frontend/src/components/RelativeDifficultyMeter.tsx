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

// const LEVEL_NAMES = ["Easy", "Moderate", "Difficult", "Hard"];
const LEVEL_SECTION_VERY_HARD = 0.1;
const Logit_ = (x: number): number => Math.log((1 - x) / x);
const D_ = Logit_(LEVEL_SECTION_VERY_HARD);
const Sigmoid_ = (x: number): number => 1 / (1 + Math.exp(-x));
const LEVEL_SECTIONS = [
  1,
  1 - LEVEL_SECTION_VERY_HARD, // Sigmoid_(D_),
  Sigmoid_(D_ / 3),
  Sigmoid_(-D_ / 3),
  LEVEL_SECTION_VERY_HARD, // Sigmoid_(-D_),
  0,
];

const DifficultyLevel = {
  VeryEasy: 0,
  Easy: 1,
  Moderate: 2,
  Difficult: 3,
  Hard: 4,
} as const;
type DifficultyLevel = typeof DifficultyLevel[keyof typeof DifficultyLevel];
const ID_TO_LEVEL: Array<DifficultyLevel> = [
  DifficultyLevel.VeryEasy,
  DifficultyLevel.Easy,
  DifficultyLevel.Moderate,
  DifficultyLevel.Difficult,
  DifficultyLevel.Hard,
];

const getDifficultyLevel = (solveProbability: number): DifficultyLevel => {
  for (let i = 0; i < 5; i++) {
    if (
      LEVEL_SECTIONS[i] >= solveProbability &&
      solveProbability > LEVEL_SECTIONS[i + 1]
    ) {
      return ID_TO_LEVEL[i];
    }
  }
  return DifficultyLevel.Hard;
};

const getRGB = (code: string) => {
  const r = parseInt(code.slice(1, 3), 16);
  const g = parseInt(code.slice(3, 5), 16);
  const b = parseInt(code.slice(5, 7), 16);
  return [r, g, b];
};

const getLevelColor = (level: DifficultyLevel, theme: Theme) => {
  switch (level) {
    case DifficultyLevel.VeryEasy:
      return theme.relativeDifficultyVeryEasyColor;
    case DifficultyLevel.Easy:
      return theme.relativeDifficultyEasyColor;
    case DifficultyLevel.Moderate:
      return theme.relativeDifficultyModerateColor;
    case DifficultyLevel.Difficult:
      return theme.relativeDifficultyDifficultColor;
    case DifficultyLevel.Hard:
      return theme.relativeDifficultyHardColor;
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
    background: `linear-gradient(to right, ${rgbStyle(r, g, b, 0)}, ${rgbStyle(
      r,
      g,
      b,
      fillRatio
    )}, ${rgbStyle(bg_r, bg_g, bg_b, fillRatio)}, ${rgbStyle(
      bg_r,
      bg_g,
      bg_b,
      1
    )})`,
  });
  const description = `Predicted Solve Probability of User: ${Math.round(
    predictedSolveProbability * 100
  )}%`;
  const meterId = `RelativeDifficultyMeter-${id}`;
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const toggleTooltipState = (): void => setTooltipOpen(!tooltipOpen);

  return (
    <>
      <div
        className="relative-difficulty-meter"
        style={styleOptions}
        id={meterId}
      />
      <Tooltip
        placement="top"
        target={meterId}
        isOpen={tooltipOpen}
        toggle={toggleTooltipState}
      >
        {description}
      </Tooltip>
    </>
  );
};
