import React, { useState } from "react";
import { Tooltip } from "reactstrap";
import * as Url from "../utils/Url";
import { getRatingColorClass } from "../utils";
import ProblemModel from "../interfaces/ProblemModel";
import { RatingInfo } from "../utils/RatingInfo";
import { DifficultyCircle } from "./DifficultyCircle";
import { NewTabLink } from "./NewTabLink";

interface Props {
  className?: string;
  problemId: string;
  contestId: string;
  problemIndex?: string;
  problemName: string;
  showDifficulty?: boolean;
  isExperimentalDifficulty?: boolean;
  showDifficultyUnavailable?: boolean;
  problemModel?: ProblemModel | null;
  userRatingInfo?: RatingInfo | null;
}

export const ProblemLink: React.FC<Props> = (props) => {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const {
    contestId,
    problemId,
    problemIndex,
    problemName,
    showDifficulty,
    isExperimentalDifficulty,
    showDifficultyUnavailable,
    problemModel,
    userRatingInfo,
  } = props;
  const problemTitle = problemIndex
    ? `${problemIndex}. ${problemName}`
    : problemName;

  const simpleLink = (
    <NewTabLink
      href={Url.formatProblemUrl(problemId, contestId)}
      className={props.className}
    >
      {problemTitle}
    </NewTabLink>
  );

  const difficulty = problemModel?.difficulty;
  if (
    showDifficulty === undefined ||
    problemModel === undefined ||
    (difficulty === undefined && !showDifficultyUnavailable)
  ) {
    return simpleLink;
  }

  const uniqueId = problemId + "-" + contestId;
  const experimentalIconId = "experimental-" + uniqueId;
  const ratingColorClass =
    difficulty === undefined ? undefined : getRatingColorClass(difficulty);

  const explicitDifficultyCircle = (
    <DifficultyCircle
      id={uniqueId}
      problemModel={problemModel}
      userRatingInfo={userRatingInfo}
    />
  );
  const experimentalDifficultySymbol = (
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
  );
  const difficultyColoredLink = (
    // Don't add rel="noreferrer" to AtCoder links
    // to allow AtCoder get the referral information.
    // eslint-disable-next-line react/jsx-no-target-blank
    <a
      href={Url.formatProblemUrl(problemId, contestId)}
      // Don't add rel="noreferrer" to AtCoder links
      // to allow AtCoder get the referral information.
      // eslint-disable-next-line react/jsx-no-target-blank
      target="_blank"
      rel="noopener"
      className={ratingColorClass}
    >
      {problemTitle}
    </a>
  );

  if (showDifficulty) {
    return (
      <>
        {explicitDifficultyCircle}
        {isExperimentalDifficulty ? experimentalDifficultySymbol : null}
        {difficultyColoredLink}
      </>
    );
  } else {
    return (
      <>
        {/* ここを、implicitにすればok */}
        {explicitDifficultyCircle}
        {isExperimentalDifficulty ? experimentalDifficultySymbol : null}
        {simpleLink}
      </>
    );
  }
};
