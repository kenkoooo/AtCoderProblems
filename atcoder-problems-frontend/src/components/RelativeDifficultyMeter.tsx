import React, { useState } from "react";
import { Tooltip } from "reactstrap";
import { predictSolveProbability } from "../utils/ProblemModelUtil";
import { ProblemModelWithDifficultyModel } from "../interfaces/ProblemModel";
import { Theme } from "../style/theme";
import { useTheme } from "./ThemeProvider";

interface Props {
  problem_id: string;
  problemModel: ProblemModelWithDifficultyModel;
  userInternalRating: number;
}

// const LEVEL_NAMES = ["Very Easy", "Easy", "Moderate", "Difficult", "Hard"];

const DifficultyLevel = {
  VeryEasy: 0,
  Easy: 1,
  Moderate: 2,
  Difficult: 3,
  Hard: 4,
} as const;
type DifficultyLevel = typeof DifficultyLevel[keyof typeof DifficultyLevel];

class RelativeDifficultyPredictionUtil {
  static get SOLVE_PROBABILITY_VERY_HARD(): number {
    return 0.1;
  }

  static get X_AT_PROBABILITY_IS_VERY_HARD(): number {
    return this.logit(this.SOLVE_PROBABILITY_VERY_HARD);
  }

  static get SOLVE_PROBABILITY_SECTIONS(): ReadonlyArray<number> {
    return [
      1,
      1 - this.SOLVE_PROBABILITY_VERY_HARD, // _sigmoid(-_D),
      this.sigmoid(-this.X_AT_PROBABILITY_IS_VERY_HARD / 3),
      this.sigmoid(this.X_AT_PROBABILITY_IS_VERY_HARD / 3),
      this.SOLVE_PROBABILITY_VERY_HARD, // _sigmoid(_D),
      0,
    ];
  }

  static logit(x: number): number {
    return Math.log(x / (1 - x));
  }

  static sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  static getDifficultyLevel(solveProbability: number): DifficultyLevel {
    for (const level of Object.values(DifficultyLevel)) {
      if (
        this.SOLVE_PROBABILITY_SECTIONS[level] >= solveProbability &&
        solveProbability > this.SOLVE_PROBABILITY_SECTIONS[level + 1]
      ) {
        return level;
      }
    }
    return DifficultyLevel.Hard;
  }
}

const getDifficultyLevelColor = (solveProbability: number, theme: Theme) => {
  const level = RelativeDifficultyPredictionUtil.getDifficultyLevel(
    solveProbability
  );
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

const getRGB = (code: string) => {
  const r = parseInt(code.slice(1, 3), 16);
  const g = parseInt(code.slice(3, 5), 16);
  const b = parseInt(code.slice(5, 7), 16);
  return [r, g, b];
};

export const RelativeDifficultyMeter: React.FC<Props> = (props) => {
  const { problem_id, problemModel, userInternalRating } = props;

  const predictedSolveProbability = predictSolveProbability(
    problemModel,
    userInternalRating
  );
  const fillRatio = 1 - predictedSolveProbability;

  const theme = useTheme();
  const color = getDifficultyLevelColor(predictedSolveProbability, theme);
  const [r, g, b] = getRGB(color);
  const [bg_r, bg_g, bg_b] = getRGB(theme.relativeDifficultyBackgroundColor);

  const styleOptions = Object({
    borderColor: color,
    background: `linear-gradient(to right, \
      rgb(${r}, ${g}, ${b}) 0%, \
      rgb(${r}, ${g}, ${b}) ${fillRatio * 100}%, \
      rgb(${bg_r}, ${bg_g}, ${bg_b}) ${fillRatio * 100}%, \
      rgb(${bg_r}, ${bg_g}, ${bg_b}) 100%\
      )`,
  });
  const description = `Predicted Solve Probability of User: \
    ${Math.round(predictedSolveProbability * 100)}%`;
  const meterId = `RelativeDifficultyMeter-${problem_id}`;
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
