import React from "react";
import { formatDuration } from "../../../../utils/DateUtil";

export default (props: { maxPoint: number; trials: number; time: number }) => (
  <>
    <p style={{ textAlign: "center" }}>
      <span style={{ color: "limegreen", fontWeight: "bold" }}>
        {props.maxPoint}
      </span>{" "}
      <span style={{ color: "red" }}>
        {props.trials === 0 ? "" : `(${props.trials})`}
      </span>
    </p>
    <p style={{ textAlign: "center" }}>
      <span style={{ color: "gray" }}>
        {props.maxPoint === 0 ? "-" : formatDuration(props.time)}
      </span>
    </p>
  </>
);
