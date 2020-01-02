import React, { useState } from "react";
import * as Url from "../utils/Url";
import { DifficultyCircle } from "./DifficultyCircle";
import { Tooltip } from "reactstrap";
import { getRatingColorClass } from "../utils";

interface Props {
  problemId: string;
  contestId: string;
  problemTitle: string;
  difficulty?: number | null;
  showDifficulty?: boolean;
  isExperimentalDifficulty?: boolean;
}

const ProblemLink = (props: Props) => {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const {
    contestId,
    problemId,
    problemTitle,
    difficulty,
    showDifficulty,
    isExperimentalDifficulty
  } = props;
  const link = (
    <a
      href={Url.formatProblemUrl(problemId, contestId)}
      target="_blank"
      rel="noopener noreferrer"
    >
      {problemTitle}
    </a>
  );
  if (!showDifficulty || difficulty === null || difficulty === undefined) {
    return link;
  }

  const uniqueId = problemId + "-" + contestId;
  const experimentalIconId = "experimental-" + uniqueId;
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
            toggle={() => setTooltipOpen(!tooltipOpen)}
          >
            This estimate is experimental.
          </Tooltip>
        </>
      ) : null}
      <a
        href={Url.formatProblemUrl(problemId, contestId)}
        target="_blank"
        rel="noopener noreferrer"
        className={getRatingColorClass(difficulty)}
      >
        {problemTitle}
      </a>
    </>
  );
};

export default ProblemLink;
