import Contest from "../interfaces/Contest";
import { ProblemStatus, StatusLabel } from "../interfaces/Status";
import { Set } from "immutable";

export const statusToTableColor = ({
  status,
  contest,
  enableColorfulMode,
  selectedLanguages
}: {
  status: ProblemStatus;
  contest: Contest | undefined;
  enableColorfulMode?: boolean;
  selectedLanguages?: Set<string>;
}) => {
  if (!contest) {
    return statusLabelToTableColor(status.label);
  }

  if (
    status.label === StatusLabel.Success &&
    selectedLanguages &&
    !status.solvedLanguages.intersect(selectedLanguages).isEmpty()
  ) {
    return "table-info";
  }

  if (enableColorfulMode === false) {
    return statusLabelToTableColor(status.label);
  }

  if (
    status.label === StatusLabel.Success &&
    status.epoch !== void 0 &&
    status.epoch <= contest.start_epoch_second + contest.duration_second
  ) {
    return status.epoch < contest.start_epoch_second
      ? "table-success-before-contest"
      : "table-success-intime";
  } else if (
    status.label === StatusLabel.Warning &&
    status.epoch <= contest.start_epoch_second + contest.duration_second
  ) {
    return "table-warning-intime";
  } else {
    return statusLabelToTableColor(status.label);
  }
};

const statusLabelToTableColor = (label: StatusLabel) => {
  switch (label) {
    case StatusLabel.Success:
      return "table-success";
    case StatusLabel.Failed:
      return "table-danger";
    case StatusLabel.Warning:
      return "table-warning";
    case StatusLabel.None:
      return "";
    default:
      return "";
  }
};
