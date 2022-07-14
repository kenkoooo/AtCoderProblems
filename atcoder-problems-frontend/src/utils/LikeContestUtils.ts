import { ContestCategory } from "./ContestClassifier";

export const getLikeContest = (
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

export const hasLikeContest = (contestCategory: ContestCategory): boolean => {
  return ["ABC", "ARC", "AGC"].includes(contestCategory);
};
