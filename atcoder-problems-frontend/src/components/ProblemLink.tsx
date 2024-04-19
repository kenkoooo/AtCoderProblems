import React, { useState } from "react";
import { Tooltip } from "reactstrap";
import * as Url from "../utils/Url";
import { getRatingColorClass } from "../utils";
import ProblemModel from "../interfaces/ProblemModel";
import { RatingInfo } from "../utils/RatingInfo";
import { ShowDifficultyMode } from "../utils/ShowDifficultyMode";
import { DifficultyCircle } from "./DifficultyCircle";
import { NewTabLink } from "./NewTabLink";

interface Props {
  className?: string;
  problemId: string;
  contestId: string;
  problemIndex?: string;
  problemName: string;
  showDifficultyMode: ShowDifficultyMode;
  isExperimentalDifficulty?: boolean;
  showDifficultyUnavailable?: boolean;
  problemModel?: ProblemModel | null;
  userRatingInfo?: RatingInfo | null;
}

export const ProblemLink: React.FC<Props> = (props) => {
  const [
    experimentalDifficultyTooltipOpen,
    setExperimentalDifficultyTooltipOpen,
  ] = useState(false);
  const [showDifficultySubClicked, setshowDifficultySubClicked] = useState(
    false
  );

  const {
    contestId,
    problemId,
    problemIndex,
    problemName,
    showDifficultyMode,
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
    problemModel === undefined ||
    (difficulty === undefined && !showDifficultyUnavailable)
  ) {
    return simpleLink;
  }

  const uniqueId = problemId + "-" + contestId;
  const experimentalIconId = "experimental-" + uniqueId;
  const showDifficultySubIconId = "show-difficulty-sub-" + uniqueId;
  const ratingColorClass =
    difficulty === undefined ? undefined : getRatingColorClass(difficulty);

  const experimentalDifficultySymbol = (
    <>
      <span id={experimentalIconId} role="img" aria-label="experimental">
        🧪
      </span>
      <Tooltip
        placement="top"
        target={experimentalIconId}
        isOpen={experimentalDifficultyTooltipOpen}
        toggle={(): void =>
          setExperimentalDifficultyTooltipOpen(
            !experimentalDifficultyTooltipOpen
          )
        }
      >
        This estimate is experimental.
      </Tooltip>
    </>
  );
  const showDifficultySubSymbol = (
    <>
      <button
        id={showDifficultySubIconId}
        role="img"
        aria-label="show-difficulty-sub"
        onClick={(): void =>
          setshowDifficultySubClicked(!showDifficultySubClicked)
        }
        style={{
          border: "none",
          background: "transparent",
        }}
      >
        {"👉 "}
      </button>
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
  const difficultySymbol = (
    <>
      <DifficultyCircle
        id={uniqueId}
        problemModel={problemModel}
        userRatingInfo={userRatingInfo}
      />
      {isExperimentalDifficulty ? experimentalDifficultySymbol : null}
    </>
  );

  switch (showDifficultyMode) {
    case ShowDifficultyMode.None:
      return <>{simpleLink}</>;
    case ShowDifficultyMode.Full:
      return (
        <>
          {difficultySymbol}
          {difficultyColoredLink}
        </>
      );
    case ShowDifficultyMode.Sub:
      return (
        <>
          {showDifficultySubSymbol}
          {showDifficultySubClicked ? difficultySymbol : null}
          {showDifficultySubClicked ? difficultyColoredLink : simpleLink}
        </>
      );
  }
};
