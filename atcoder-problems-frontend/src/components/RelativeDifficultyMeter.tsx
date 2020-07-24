import React, { useState } from "react";
import { Tooltip } from "reactstrap";
import { predictSolveProbability } from "../utils/ProblemModelUtil";
import { ProblemModelWithDifficultyModel } from "../interfaces/ProblemModel";
import { Theme } from "../style/theme";
import { useTheme } from "./ThemeProvider";

interface Props {
  problemId: string;
  problemModel: ProblemModelWithDifficultyModel;
  userInternalRating: number;
}

const logit = (x: number): number => {
  return Math.log(x / (1 - x));
};
const sigmoid = (x: number): number => {
  return 1 / (1 + Math.exp(-x));
};

const SOLVE_PROB_MAX_HARD = 0.1;
const X_AT_PROB_MAX_HARD = logit(SOLVE_PROB_MAX_HARD);
const SOLVE_PROB_MAX_DIFFICULT = sigmoid(X_AT_PROB_MAX_HARD / 3);
const SOLVE_PROB_MAX_MODERATE = sigmoid(-X_AT_PROB_MAX_HARD / 3);
const SOLVE_PROB_MAX_EASY = 1 - SOLVE_PROB_MAX_HARD;
// const SOLVE_PROB_MAX_VERY_EASY: number = 1;

const getRelDiffLevelColor = (
  solveProbability: number,
  theme: Theme
): string => {
  if (solveProbability <= SOLVE_PROB_MAX_HARD)
    return theme.relativeDifficultyHardColor;
  else if (solveProbability <= SOLVE_PROB_MAX_DIFFICULT)
    return theme.relativeDifficultyDifficultColor;
  else if (solveProbability <= SOLVE_PROB_MAX_MODERATE)
    return theme.relativeDifficultyModerateColor;
  else if (solveProbability <= SOLVE_PROB_MAX_EASY)
    return theme.relativeDifficultyEasyColor;
  // else if (solveProbability <= SOLVE_PROB_MAX_VERY_EASY)
  else return theme.relativeDifficultyVeryEasyColor;
};

export const RelativeDifficultyMeter: React.FC<Props> = (props) => {
  const { problemId, problemModel, userInternalRating } = props;

  const predictedSolveProbability = predictSolveProbability(
    problemModel,
    userInternalRating
  );
  const fillRatio = 1 - predictedSolveProbability;

  const theme = useTheme();
  const meter_color = getRelDiffLevelColor(predictedSolveProbability, theme);
  const bg_color = theme.relativeDifficultyBackgroundColor;

  const styleOptions = Object({
    borderColor: meter_color,
    background: `linear-gradient(to right, \
      ${meter_color} 0%, \
      ${meter_color} ${fillRatio * 100}%, \
      ${bg_color} ${fillRatio * 100}%, \
      ${bg_color} 100%\
      )`,
  });
  const description = `Predicted Solve Probability of User: \
    ${Math.round(predictedSolveProbability * 100)}%`;
  const meterId = `RelativeDifficultyMeter-${problemId}`;
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
