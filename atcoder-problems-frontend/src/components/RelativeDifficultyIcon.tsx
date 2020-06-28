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

const getRGB = (code: string) => {
  const r: number = parseInt(code.slice(1, 3), 16);
  const g: number = parseInt(code.slice(3, 5), 16);
  const b: number = parseInt(code.slice(5, 7), 16);
  return [r, g, b];
};

const getLevelColors = (theme: Theme) => {
  return [
    theme.relativeDifficultyEasyColor,
    theme.relativeDifficultyModerateColor,
    theme.relativeDifficultyDifficultColor,
  ];
};

const LEVEL_NAMES = ["Easy", "Moderate", "Difficult"];

const RelativeDifficultyIcon: React.FC<Props> = (props) => {
  const { id, problemModel, userInternalRating } = props;
  const predictedSolveProbability = predictSolveProbability(
    problemModel,
    userInternalRating
  );
  const relativeDifficultyRatio = 1 - predictedSolveProbability;
  const difficultyLevel = (relativeDifficultyRatio * 3) | 0;
  const fillRatio = (relativeDifficultyRatio - 0.333 * difficultyLevel) / 0.333;
  const theme = useTheme();
  const color = getLevelColors(theme)[difficultyLevel];
  const [r, g, b] = getRGB(color);
  const [bg_r, bg_g, bg_b] = getRGB(theme.relativeDifficultyBackgroundColor);
  const color_styles = [
    `rgb(${r}, ${g}, ${b}) 0%`,
    `rgb(${r}, ${g}, ${b}) ${fillRatio * 100}%`,
    `rgb(${bg_r}, ${bg_g}, ${bg_b}) ${fillRatio * 100}%`,
    `rgb(${bg_r}, ${bg_g}, ${bg_b}) 100%`,
  ];

  const styleOptions = Object({
    borderColor: color,
    background: `linear-gradient(to right, ${color_styles.join(", ")})`,
  });
  const description = `Relative difficulty: ${
    LEVEL_NAMES[difficultyLevel]
  }\nPredicted solve probability: ${Math.round(
    predictedSolveProbability * 100
  )}%`;
  const iconId = `RelativeDifficultyIcon-${id}`;
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const toggleTooltipState = (): void => setTooltipOpen(!tooltipOpen);

  return (
    <>
      <div
        className="relative-difficulty-icon"
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

export default RelativeDifficultyIcon;
