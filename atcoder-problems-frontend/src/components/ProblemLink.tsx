import React, { useState } from "react";
import * as Url from "../utils/Url";
import { DifficultyCircle } from "./DifficultyCircle";
import { Tooltip } from "reactstrap";

interface Props {
  problemId: string;
  contestId: string;
  problemTitle: string;
  difficulty: number | null;
  showDifficulty: boolean;
  isExperimentalDifficulty: boolean;
}

function getColorClass(difficulty: number | null): string {
  if (difficulty === null) {
    return "";
  }
  if (difficulty < 400) {
    return "difficulty-grey";
  } else if (difficulty < 800) {
    return "difficulty-brown";
  } else if (difficulty < 1200) {
    return "difficulty-green";
  } else if (difficulty < 1600) {
    return "difficulty-cyan";
  } else if (difficulty < 2000) {
    return "difficulty-blue";
  } else if (difficulty < 2400) {
    return "difficulty-yellow";
  } else if (difficulty < 2800) {
    return "difficulty-orange";
  } else {
    return "difficulty-red";
  }
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
  if (!showDifficulty) {
    return link;
  }

  if (difficulty === null) {
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
        className={getColorClass(difficulty)}
      >
        {problemTitle}
      </a>
    </>
  );
};

export default ProblemLink;
