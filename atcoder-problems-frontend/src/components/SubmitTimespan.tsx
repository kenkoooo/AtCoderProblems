import React from "react";
import Contest from "../interfaces/Contest";
import { ProblemStatus, StatusLabel } from "../interfaces/Status";

interface Props {
  contest: Contest;
  problemStatus?: ProblemStatus;
  showPenalties: boolean;
}

const formatTimespan = (sec: number): string => {
  let sign;
  if (sec >= 0) {
    sign = "";
  } else {
    sign = "-";
    sec *= -1;
  }
  return `${sign}${Math.floor(sec / 60)}:${("0" + (sec % 60)).slice(-2)}`;
};

export const SubmitTimespan: React.FC<Props> = (props) => {
  const { contest, problemStatus, showPenalties } = props;
  if (!problemStatus || problemStatus.label === StatusLabel.None) {
    return null;
  }

  const penalty = problemStatus.rejectedEpochSeconds.filter(
    (epoch) => epoch <= contest.start_epoch_second + contest.duration_second
  ).length;

  return (
    <div className="table-problem-timespan">
      {problemStatus.label !== StatusLabel.Success ||
      problemStatus.epoch > contest.start_epoch_second + contest.duration_second
        ? ""
        : formatTimespan(problemStatus.epoch - contest.start_epoch_second)}
      {showPenalties && penalty > 0 && (
        <span className="table-problem-timespan-penalty">{`(${penalty})`}</span>
      )}
    </div>
  );
};
