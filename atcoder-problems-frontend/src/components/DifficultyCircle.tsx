import React, { useState } from "react";
import { Badge, Tooltip } from "reactstrap";
import { CompletedRatingColor, getRatingColor } from "../utils";
import ProblemModel, {
  isProblemModelWithDifficultyModel,
  isProblemModelWithTimeModel,
  ProblemModelWithDifficultyModel,
  ProblemModelWithTimeModel,
} from "../interfaces/ProblemModel";
import {
  predictSolveProbability,
  predictSolveTime,
  formatPredictedSolveProbability,
  formatPredictedSolveTime,
} from "../utils/ProblemModelUtil";
import { RatingInfo } from "../utils/RatingInfo";
import { TopcoderLikeCircle } from "./TopcoderLikeCircle";

interface Props {
  id: string;
  problemModel?: ProblemModel | null;
  userRatingInfo?: RatingInfo | null;
}

interface LocalState {
  tooltipOpen: boolean;
}

function getColor(difficulty: number): CompletedRatingColor {
  if (difficulty >= 3200) {
    if (difficulty < 3600) {
      return "Bronze";
    } else if (difficulty < 4000) {
      return "Silver";
    } else {
      return "Gold";
    }
  } else {
    return getRatingColor(difficulty);
  }
}

export const DifficultyCircle: React.FC<Props> = (props) => {
  const { id, problemModel, userRatingInfo } = props;
  const difficulty = problemModel?.difficulty;
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const toggleTooltipState = (): void => setTooltipOpen(!tooltipOpen);
  const circleId = "DifficultyCircle-" + id;
  if (difficulty === undefined) {
    return (
      <span>
        <Badge
          className="difficulty-unavailable-circle"
          color="info"
          id={circleId}
          pill
        >
          ?
        </Badge>
        <Tooltip
          placement="top"
          target={circleId}
          isOpen={tooltipOpen}
          toggle={toggleTooltipState}
        >
          Difficulty is unavailable.
        </Tooltip>
      </span>
    );
  }
  const color = getColor(difficulty);
  const fillRatio: number = difficulty >= 3200 ? 1.0 : (difficulty % 400) / 400;
  const predictdProb: string =
    problemModel === undefined
      ? "-"
      : userRatingInfo?.internalRating === undefined ||
        userRatingInfo?.internalRating === null
      ? "-"
      : isProblemModelWithDifficultyModel(problemModel) === false
      ? "-"
      : formatPredictedSolveProbability(
          predictSolveProbability(
            problemModel as ProblemModelWithDifficultyModel,
            userRatingInfo.internalRating
          )
        );
  const predictdTime =
    problemModel === undefined
      ? "-"
      : userRatingInfo?.internalRating === undefined ||
        userRatingInfo?.internalRating === null
      ? "-"
      : isProblemModelWithTimeModel(problemModel) === false
      ? "-"
      : formatPredictedSolveTime(
          predictSolveTime(
            problemModel as ProblemModelWithTimeModel,
            userRatingInfo.internalRating
          )
        );
  const contentDifficulty = `Difficulty: ${difficulty}`;
  const contentProbability = `Solve Prob: ${predictdProb}`;
  const contentTime = `Solve Time: ${predictdTime}`;

  const content = (
    <>
      {contentDifficulty}
      <br />
      {contentProbability}
      <br />
      {contentTime}
    </>
  );
  return (
    <>
      <TopcoderLikeCircle
        color={color}
        fillRatio={fillRatio}
        className="difficulty-circle"
        id={circleId}
      />
      <Tooltip
        placement="top"
        target={circleId}
        isOpen={tooltipOpen}
        toggle={toggleTooltipState}
      >
        {content}
      </Tooltip>
    </>
  );
};
