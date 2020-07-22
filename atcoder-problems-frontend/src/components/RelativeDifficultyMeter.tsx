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

class RelDiffPredictionUtil {
  private static logit(x: number): number {
    return Math.log(x / (1 - x));
  }
  private static sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }
  private static get X_AT_PROB_MAX_HARD(): number {
    return RelDiffPredictionUtil.logit(this.SOLVE_PROB_MAX_HARD);
  }

  private static get SOLVE_PROB_MAX_HARD(): number {
    return 0.1;
  }
  private static get SOLVE_PROB_MAX_DIFFICULT(): number {
    return this.sigmoid(this.X_AT_PROB_MAX_HARD / 3);
  }
  private static get SOLVE_PROB_MAX_MODERATE(): number {
    return this.sigmoid(-this.X_AT_PROB_MAX_HARD / 3);
  }
  private static get SOLVE_PROB_MAX_EASY(): number {
    return 1 - this.SOLVE_PROB_MAX_HARD;
  }
  // private static get SOLVE_PROB_MAX_VERY_EASY(): number {  return 1; }

  public static getRelDiffLevelColor(
    solveProbability: number,
    theme: Theme
  ): string {
    if (solveProbability <= this.SOLVE_PROB_MAX_HARD)
      return theme.relativeDifficultyHardColor;
    else if (solveProbability <= this.SOLVE_PROB_MAX_DIFFICULT)
      return theme.relativeDifficultyDifficultColor;
    else if (solveProbability <= this.SOLVE_PROB_MAX_MODERATE)
      return theme.relativeDifficultyModerateColor;
    else if (solveProbability <= this.SOLVE_PROB_MAX_EASY)
      return theme.relativeDifficultyEasyColor;
    // if (solveProbability <= this.SOLVE_PROB_MAX_VERY_EASY)
    else return theme.relativeDifficultyVeryEasyColor;
  }
}

export const RelativeDifficultyMeter: React.FC<Props> = (props) => {
  const { problemId, problemModel, userInternalRating } = props;

  const predictedSolveProbability = predictSolveProbability(
    problemModel,
    userInternalRating
  );
  const fillRatio = 1 - predictedSolveProbability;

  const theme = useTheme();
  const meter_color = RelDiffPredictionUtil.getRelDiffLevelColor(
    predictedSolveProbability,
    theme
  );
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
