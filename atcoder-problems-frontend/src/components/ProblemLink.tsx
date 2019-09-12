import React from "react";
import * as Url from "../utils/Url";
import { DifficultyCircle } from "./DifficultyCircle";

interface Props {
  problemId: string;
  contestId: string;
  problemTitle: string;
  difficulty: number | null;
  showDifficulty: boolean;
}

function getColorClass(difficulty: number | null): string {
  if (difficulty === null) return "";
  if (difficulty < 400) return "difficulty-grey";
  // grey
  else if (difficulty < 800) return "difficulty-brown";
  // brown
  else if (difficulty < 1200) return "difficulty-green";
  // green
  else if (difficulty < 1600) return "difficulty-cyan";
  // cyan
  else if (difficulty < 2000) return "difficulty-blue";
  // blue
  else if (difficulty < 2400) return "difficulty-yellow";
  // yellow
  else if (difficulty < 2800) return "difficulty-orange";
  // orange
  else return "difficulty-red"; // red
}

const ProblemLink: React.FC<Props> = props => {
  const {
    contestId,
    problemId,
    problemTitle,
    difficulty,
    showDifficulty
  } = props;
  const link = (
    <a href={Url.formatProblemUrl(problemId, contestId)} target="_blank">
      {problemTitle}
    </a>
  );
  if (!showDifficulty) return link;

  if (difficulty === null) return link;
  return (
    <>
      <DifficultyCircle
        id={problemId + "-" + contestId}
        difficulty={difficulty}
      />
      <a
        href={Url.formatProblemUrl(problemId, contestId)}
        target="_blank"
        className={getColorClass(difficulty)}
      >
        {problemTitle}
      </a>
    </>
  );
};

export default ProblemLink;
