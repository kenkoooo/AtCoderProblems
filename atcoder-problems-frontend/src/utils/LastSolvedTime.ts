import { ProblemId } from "../interfaces/Status";
import Submission from "../interfaces/Submission";
import { isAccepted } from "./index";

export const ExcludeOptions = [
  "Exclude",
  "Exclude submitted",
  "2 Years",
  "1 Year",
  "6 Months",
  "4 Weeks",
  "2 Weeks",
  "1 Week",
  "Don't exclude",
] as const;
export type ExcludeOption = typeof ExcludeOptions[number];

export const formatExcludeOption = (excludeOption: ExcludeOption): string => {
  switch (excludeOption) {
    case "1 Week":
      return "Exclude problems solved in last 7 days";
    case "2 Weeks":
      return "Exclude problems solved in last 2 weeks";
    case "4 Weeks":
      return "Exclude problems solved in last 4 weeks";
    case "6 Months":
      return "Exclude problems solved in last 6 months";
    case "1 Year":
      return "Exclude problems solved in last 1 Year";
    case "2 Years":
      return "Exclude problems solved in last 2 Years";
    case "Exclude":
      return "Exclude all the solved problems";
    case "Don't exclude":
      return "Don't exclude solved problems";
    case "Exclude submitted":
      return "Exclude all the submitted problems";
  }
};

export const getCurrentSecond = (): number => {
  return Math.floor(new Date().getTime() / 1000);
};

export const getMaximumExcludeElapsedSecond = (
  excludeOption: Exclude<ExcludeOption, "Exclude submitted">
) => {
  switch (excludeOption) {
    case "Exclude":
      return Number.MAX_SAFE_INTEGER - 1;
    case "1 Week":
      return 3600 * 24 * 7;
    case "2 Weeks":
      return 3600 * 24 * 14;
    case "4 Weeks":
      return 3600 * 24 * 28;
    case "6 Months":
      return 3600 * 24 * 180;
    case "1 Year":
      return 3600 * 24 * 365;
    case "2 Years":
      return 3600 * 24 * 365 * 2;
    case "Don't exclude":
      return 0;
  }
};

export const getLastSolvedTimeMap = (userSubmissions: Submission[]) => {
  const lastSolvedTimeMap = new Map<ProblemId, number>();
  userSubmissions
    .filter((s) => isAccepted(s.result))
    .forEach((s) => {
      const cur = lastSolvedTimeMap.get(s.problem_id) ?? 0;
      lastSolvedTimeMap.set(s.problem_id, Math.max(s.epoch_second, cur));
    });
  return lastSolvedTimeMap;
};
