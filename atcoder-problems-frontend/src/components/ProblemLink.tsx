import React, { useState } from "react";
import { Tooltip } from "reactstrap";
import * as Url from "../utils/Url";
import { getRatingColorClass } from "../utils";
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
import { DifficultyCircle } from "./DifficultyCircle";
import { NewTabLink } from "./NewTabLink";

interface Props {
  className?: string;
  problemId: string;
  contestId: string;
  problemTitle: string;
  difficulty?: number | null;
  showDifficulty?: boolean;
  isExperimentalDifficulty?: boolean;
  showDifficultyUnavailable?: boolean;
  problemModel?: ProblemModel | null;
  internalRating?: number | null;
}

export const ProblemLink: React.FC<Props> = (props) => {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const {
    contestId,
    problemId,
    problemTitle,
    difficulty,
    showDifficulty,
    isExperimentalDifficulty,
    showDifficultyUnavailable,
    problemModel,
    internalRating,
  } = props;
  const link = (
    <NewTabLink
      href={Url.formatProblemUrl(problemId, contestId)}
      className={props.className}
    >
      {problemTitle}
    </NewTabLink>
  );
  if (
    !showDifficulty ||
    difficulty === undefined ||
    (difficulty === null && !showDifficultyUnavailable)
  ) {
    return link;
  }

  const uniqueId = problemId + "-" + contestId;
  const experimentalIconId = "experimental-" + uniqueId;
  const ratingColorClass =
    difficulty === null ? undefined : getRatingColorClass(difficulty);
  const predictdProb: string =
    problemModel === undefined
      ? "-"
      : internalRating === undefined || internalRating === null
      ? "-"
      : isProblemModelWithDifficultyModel(problemModel) === false
      ? "-"
      : formatPredictedSolveProbability(
          predictSolveProbability(
            problemModel as ProblemModelWithDifficultyModel,
            internalRating
          )
        );
  const predictdTime =
    problemModel === undefined
      ? "-"
      : internalRating === undefined || internalRating === null
      ? "-"
      : isProblemModelWithTimeModel(problemModel) === false
      ? "-"
      : formatPredictedSolveTime(
          predictSolveTime(
            problemModel as ProblemModelWithTimeModel,
            internalRating
          )
        );
  return (
    <>
      <DifficultyCircle
        id={uniqueId}
        difficulty={difficulty}
        predictedSolveProbabilityText={predictdProb}
        predictedSolveTimeText={predictdTime}
      />
      {isExperimentalDifficulty ? (
        <>
          <span id={experimentalIconId} role="img" aria-label="experimental">
            🧪
          </span>
          <Tooltip
            placement="top"
            target={experimentalIconId}
            isOpen={tooltipOpen}
            toggle={(): void => setTooltipOpen(!tooltipOpen)}
          >
            This estimate is experimental.
          </Tooltip>
        </>
      ) : null}
      <a
        href={Url.formatProblemUrl(problemId, contestId)}
        target="_blank" // eslint-disable-line react/jsx-no-target-blank
        rel="noopener"
        className={ratingColorClass}
      >
        {problemTitle}
      </a>
    </>
  );
};
