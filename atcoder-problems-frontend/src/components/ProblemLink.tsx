import React, { useState } from "react";
import { Tooltip } from "reactstrap";
import * as Url from "../utils/Url";
import { getRatingColorClass } from "../utils";
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
}

const ProblemLink: React.FC<Props> = (props) => {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const {
    contestId,
    problemId,
    problemTitle,
    difficulty,
    showDifficulty,
    isExperimentalDifficulty,
    showDifficultyUnavailable,
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
  return (
    <>
      <DifficultyCircle id={uniqueId} difficulty={difficulty} />
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

export default ProblemLink;
