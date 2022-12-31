import React, { useState } from "react";
import { Popover } from "reactstrap";
import { ScoreCell } from "../ScoreCell";
import { ProblemLink } from "../../../../../components/ProblemLink";
import { formatProblemUrl } from "../../../../../utils/Url";
import { NewTabLink } from "../../../../../components/NewTabLink";

interface Props {
  problem: {
    title?: string;
    id: string;
    contestId?: string;
    point: number | null;
  };
  maxPoint?: number;
  trials?: number;
  time?: number;
  id: string;
}

export const SmallScoreCell: React.FC<Props> = (props) => {
  const { maxPoint, trials, problem, time, id } = props;
  const [showTooltip, setShowTooltip] = useState(false);

  const sanitizedId = id.replace(/[ #]/g, "");
  const cellId = `small-score-cell-${sanitizedId}`;
  const className = formatCellClassName({ maxPoint, trials, time });
  const problemUrl = problem.contestId
    ? formatProblemUrl(problem.id, problem.contestId)
    : undefined;

  return (
    <NewTabLink href={problemUrl}>
      <div
        className={className}
        id={cellId}
        onMouseOver={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Popover isOpen={showTooltip} placement="top" target={"#" + cellId}>
          <div className="small-score-cell-tooltip">
            {problem.contestId && problem.title ? (
              <ProblemLink
                problemId={problem.id}
                contestId={problem.contestId}
                problemName={problem.title}
              />
            ) : (
              <b>{problem.title}</b>
            )}
            <br />
            {isNumber(maxPoint) && isNumber(trials) && isNumber(time) ? (
              <ScoreCell maxPoint={maxPoint} time={time} trials={trials} />
            ) : null}
          </div>
        </Popover>
      </div>
    </NewTabLink>
  );
};

const formatCellClassName = ({
  maxPoint,
  trials,
  time,
}: {
  maxPoint?: number;
  trials?: number;
  time?: number;
}) => {
  if (isNumber(maxPoint) && isNumber(trials) && isNumber(time)) {
    if (maxPoint === 0 && trials > 0) {
      return "small-score-cell small-score-cell-warning";
    } else if (maxPoint > 0) {
      return "small-score-cell small-score-cell-success";
    }
  }
  return "small-score-cell";
};

const isNumber = (x: unknown): x is number => {
  return typeof x === "number" && isFinite(x);
};
