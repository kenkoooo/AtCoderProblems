import { ContestCategory } from "./ContestClassifier";

export const getLikeContestCategory = (
  contestCategory: ContestCategory
): ContestCategory | undefined => {
  switch (contestCategory) {
    case "ABC":
      return "ABC-Like";
    case "ARC":
      return "ARC-Like";
    case "AGC":
      return "AGC-Like";
    default:
      break;
  }
};

export const LikeContestCategories: readonly ContestCategory[] = [
  "ABC-Like",
  "ARC-Like",
  "AGC-Like",
];
