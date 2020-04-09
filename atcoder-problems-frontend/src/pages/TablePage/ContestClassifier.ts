import Contest from "../../interfaces/Contest";

export const ContestCategories = [
  "ABC",
  "ARC",
  "AGC",
  "Other Rated Contests",
  "Other Contests"
] as const;
export type ContestCategory = typeof ContestCategories[number];

export const AGC_001_START = 1468670400;
export const classifyContest = (contest: Contest): ContestCategory => {
  if (contest.id.match(/^abc\d{3}$/)) {
    return "ABC";
  }
  if (contest.id.match(/^arc\d{3}$/)) {
    return "ARC";
  }
  if (contest.id.match(/^agc\d{3}$/)) {
    return "AGC";
  }

  if (
    contest.rate_change !== "-" &&
    contest.start_epoch_second >= AGC_001_START
  ) {
    return "Other Rated Contests";
  }
  return "Other Contests";
};
