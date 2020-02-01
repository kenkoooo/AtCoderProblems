import React from "react";
import Contest from "../interfaces/Contest";
import { ProblemStatus, StatusLabel } from "../interfaces/Status";

interface Props {
  contest: Contest;
  problemStatus?: ProblemStatus;
  enableColorfulMode: boolean;
}

const formatTimespan = (sec: number) => {
  let sign;
  if (sec >= 0) {
    sign = "";
  } else {
    sign = "-";
    sec *= -1;
  }
  return `${sign}${Math.floor(sec / 60)}:${("0" + (sec % 60)).slice(-2)}`;
};

const SubmitTimespan: React.FC<Props> = props => {
  const { contest, problemStatus, enableColorfulMode } = props;
  if (!enableColorfulMode) {
    return null;
  }

  return (
    <div className="table-problem-timespan">
      {!problemStatus ||
      problemStatus.label !== StatusLabel.Success ||
      problemStatus.epoch > contest.start_epoch_second + contest.duration_second
        ? ""
        : formatTimespan(problemStatus.epoch - contest.start_epoch_second)}
    </div>
  );
};

export default SubmitTimespan;
