import { ProblemId } from "../interfaces/Status";
import Submission from "../interfaces/Submission";
import { isAccepted } from "./index";

export const ExcludeOptions = [
  "Exclude",
  "Exclude submitted",
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

export const isIncludedSolvedTime = (
  excludeOption: ExcludeOption,
  currentSecond: number,
  lastSolvedTime: number | undefined,
  isSubmitted: boolean
): boolean => {
  if (typeof lastSolvedTime !== "undefined") {
    const seconds = currentSecond - lastSolvedTime;
    switch (excludeOption) {
      case "Exclude":
      case "Exclude submitted":
        return false;
      case "1 Week":
        return seconds > 3600 * 24 * 7;
      case "2 Weeks":
        return seconds > 3600 * 24 * 14;
      case "4 Weeks":
        return seconds > 3600 * 24 * 28;
      case "6 Months":
        return seconds > 3600 * 24 * 180;
      case "Don't exclude":
        return true;
    }
  }
  if (excludeOption === "Exclude submitted") {
    return !isSubmitted;
  }
  return true;
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
