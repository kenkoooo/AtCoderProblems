import React from "react";
import { formatDuration } from "../../../../utils/DateUtil";

interface Props {
  maxPoint: number;
  trials: number;
  time: number;
}

export const ScoreCell: React.FC<Props> = (props) => (
  <>
    <p style={{ textAlign: "center", margin: 0 }}>
      <span style={{ color: "limegreen", fontWeight: "bold" }}>
        {props.maxPoint}
      </span>{" "}
      <span style={{ color: "red" }}>
        {props.trials === 0 ? "" : `(${props.trials})`}
      </span>
    </p>
    <p style={{ textAlign: "center", margin: 0 }}>
      <span style={{ color: "gray" }}>
        {props.maxPoint === 0 ? "-" : formatDuration(props.time)}
      </span>
    </p>
  </>
);
