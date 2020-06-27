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
    getRGB(theme.relativeDifficultyEasyColor),
    getRGB(theme.relativeDifficultyModerateColor),
    getRGB(theme.relativeDifficultyDifficultColor),
  ];
};

const RelativeDifficultyIcon: React.FC<Props> = (props) => {
  const { id, problemModel, userInternalRating } = props;
  const predictedSolveProbability = predictSolveProbability(
    problemModel,
    userInternalRating
  );
  const relativeDifficultyRatio = 1 - predictedSolveProbability;
  // const difficultyLevel = (predictedSolveProbability * 3)|0;
  const theme = useTheme();
  const colors = getLevelColors(theme);
  const styles = [];
  const [gray_r, gray_g, gray_b] = getRGB(
    theme.relativeDifficultyBackgroundColor
  );
  for (let i = 0, curRatio = 0; i < 3; i++) {
    const [r, g, b] = colors[i];
    const nextRatio = curRatio + 0.333;
    const toRatio = Math.max(
      Math.min(nextRatio, relativeDifficultyRatio),
      curRatio
    );
    if (curRatio < toRatio) {
      styles.push(`rgb(${r}, ${g}, ${b}) ${curRatio * 100}%`);
      styles.push(`rgb(${r}, ${g}, ${b}) ${toRatio * 100}%`);
    }
    if (toRatio < nextRatio) {
      styles.push(`rgb(${gray_r}, ${gray_g}, ${gray_b}) ${toRatio * 100}%`);
      styles.push(`rgb(${gray_r}, ${gray_g}, ${gray_b}) ${nextRatio * 100}%`);
    }
    curRatio = nextRatio;
  }

  const styleOptions = Object({
    background: `linear-gradient(to right, ${styles.join(", ")})`,
  });
  const description = `Predicted solve probability of User: ${Math.round(
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
