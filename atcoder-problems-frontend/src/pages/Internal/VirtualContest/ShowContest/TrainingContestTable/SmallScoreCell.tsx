import { isNumber } from "util";
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
  const classes =
    "small-score-cell " +
    (isNumber(maxPoint) && isNumber(trials) && isNumber(time)
      ? (maxPoint === 0 && trials > 0 ? "small-score-cell-warning " : "") +
        (maxPoint > 0 ? "small-score-cell-success" : "")
      : "");
  const problemUrl = problem.contestId
    ? formatProblemUrl(problem.id, problem.contestId)
    : undefined;

  return (
    <NewTabLink href={problemUrl}>
      <div
        className={classes}
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
                problemTitle={problem.title}
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
