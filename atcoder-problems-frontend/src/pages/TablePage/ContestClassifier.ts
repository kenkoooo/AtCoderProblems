import Contest from "../../interfaces/Contest";
import { RatedTargetType, getRatedTarget } from "../../components/ContestLink";

export const ContestCategories = [
  "ABC",
  "ARC",
  "AGC",
  "ABC-Like",
  "ARC-Like",
  "AGC-Like",
  "PAST",
  "JOI",
  "JAG",
  "Marathon",
  "Other Contests",
] as const;
export type ContestCategory = typeof ContestCategories[number];

export const AGC_001_START = 1468670400;

export const isRatedContest = (contest: Contest): boolean => {
  return (
    contest.rate_change !== "-" && contest.start_epoch_second >= AGC_001_START
  );
};

const classifyOtherRatedContest = (contest: Contest): ContestCategory => {
  const rated = getRatedTarget(contest);
  if (rated === RatedTargetType.All) {
    return "AGC-Like";
  }
  if (rated < 2000) {
    return "ABC-Like";
  }

  return "ARC-Like";
};

export const classifyContest = (contest: Contest): ContestCategory => {
  if (/^abc\d{3}$/.exec(contest.id)) {
    return "ABC";
  }
  if (/^arc\d{3}$/.exec(contest.id)) {
    return "ARC";
  }
  if (/^agc\d{3}$/.exec(contest.id)) {
    return "AGC";
  }

  if (isRatedContest(contest)) {
    return classifyOtherRatedContest(contest);
  }

  if (contest.id.startsWith("past")) {
    return "PAST";
  }
  if (contest.id.startsWith("joi")) {
    return "JOI";
  }
  if (/^(jag|JAG)/.exec(contest.id)) {
    return "JAG";
  }
  if (
    /(^Chokudai Contest|ハーフマラソン|^HACK TO THE FUTURE|Asprova|Heuristics Contest)/.exec(
      contest.title
    ) ||
    /(^future-meets-you-contest|^hokudai-hitachi)/.exec(contest.id) ||
    [
      "caddi2019",
      "pakencamp-2019-day2",
      "kuronekoyamato-contest2019",
      "wn2017_1",
    ].includes(contest.id)
  ) {
    return "Marathon";
  }

  return "Other Contests";
};
