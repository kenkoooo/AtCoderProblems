import React, { useState } from "react";
import { Popover } from "reactstrap";
import ScoreCell from "./ScoreCell";

interface Props {
  problem: {
    title?: string;
    point: number | null;
  };
  point: number;
  trials: number;
  time: number;
}

const SmallScoreCell: React.FC<Props> = (props) => {
  const { point, trials, problem, time } = props;
  const [showTooltip, setShowTooltip] = useState(false);
  const [uniqueId] = useState(
    Math.random()
      .toString()
      .replace(/[^0-9]/g, "")
  );

  const cellId = `small-score-cell-${uniqueId}`;
  const classes =
    "small-score-cell " +
    (point === 0 && trials > 0 ? "small-score-cell-warning " : "") +
    (point > 0 ? "small-score-cell-success" : "");

  return (
    <div
      className={classes}
      id={cellId}
      onMouseOver={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Popover isOpen={showTooltip} placement="top" target={"#" + cellId}>
        <div className="small-score-cell-tooltip">
          <b>{problem.title}</b>
          <br />
          {point > 0 || trials > 0 ? (
            <ScoreCell maxPoint={point} time={time} trials={trials} />
          ) : null}
        </div>
      </Popover>
    </div>
  );
};

export default SmallScoreCell;
