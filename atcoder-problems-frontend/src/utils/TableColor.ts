import Contest from "../interfaces/Contest";
import { ProblemStatus, StatusLabel } from "../interfaces/Status";
import { List, Set } from "immutable";

export enum ColorMode {
  None = "None",
  ContestResult = "ContestResult",
  Language = "Language"
}

export enum TableColor {
  None = "",
  Success = "table-success",
  Danger = "table-danger",
  Warning = "table-warning",
  SuccessBeforeContest = "table-success-before-contest",
  SuccessIntime = "table-success-intime",
  WarningIntime = "table-warning-intime",
  SuccessLanguage = "table-success-language"
}

const SUCCESS_COLOR_SET = Set.of(
  TableColor.Success,
  TableColor.SuccessBeforeContest,
  TableColor.SuccessIntime,
  TableColor.SuccessLanguage
);

export const combineTableColorList = ({
  colorMode,
  colorList
}: {
  colorMode: ColorMode;
  colorList: List<TableColor>;
}): TableColor => {
  switch (colorMode) {
    case ColorMode.ContestResult: {
      if (colorList.every(color => color === TableColor.SuccessBeforeContest)) {
        return TableColor.SuccessBeforeContest;
      } else if (colorList.every(color => color === TableColor.SuccessIntime)) {
        return TableColor.SuccessIntime;
      }
      break;
    }
    case ColorMode.Language: {
      if (colorList.every(color => color === TableColor.SuccessLanguage)) {
        return TableColor.SuccessLanguage;
      }
      break;
    }
  }
  if (colorList.isSubset(SUCCESS_COLOR_SET)) {
    return TableColor.Success;
  } else {
    return TableColor.None;
  }
};

const statusLabelToTableColor = (label: StatusLabel): TableColor => {
  switch (label) {
    case StatusLabel.Success:
      return TableColor.Success;
    case StatusLabel.Failed:
      return TableColor.Danger;
    case StatusLabel.Warning:
      return TableColor.Warning;
    case StatusLabel.None:
      return TableColor.None;
    default:
      return TableColor.None;
  }
};

export const statusToTableColor = ({
  colorMode,
  status,
  contest,
  selectedLanguages
}: {
  colorMode: ColorMode;
  status: ProblemStatus;
  contest: Contest | undefined;
  selectedLanguages?: Set<string>;
}): TableColor => {
  switch (colorMode) {
    case ColorMode.None: {
      return statusLabelToTableColor(status.label);
    }
    case ColorMode.ContestResult: {
      if (!contest) {
        return statusLabelToTableColor(status.label);
      }
      if (
        status.label === StatusLabel.Success &&
        status.epoch !== void 0 &&
        status.epoch <= contest.start_epoch_second + contest.duration_second
      ) {
        return status.epoch < contest.start_epoch_second
          ? TableColor.SuccessBeforeContest
          : TableColor.SuccessIntime;
      } else if (
        status.label === StatusLabel.Warning &&
        status.epoch <= contest.start_epoch_second + contest.duration_second
      ) {
        return TableColor.WarningIntime;
      } else {
        return statusLabelToTableColor(status.label);
      }
    }
    case ColorMode.Language: {
      if (
        status.label === StatusLabel.Success &&
        selectedLanguages &&
        Array.from(status.solvedLanguages).some(solvedLanguage =>
          selectedLanguages.has(solvedLanguage)
        )
      ) {
        return TableColor.SuccessLanguage;
      } else {
        return statusLabelToTableColor(status.label);
      }
    }
  }
};
