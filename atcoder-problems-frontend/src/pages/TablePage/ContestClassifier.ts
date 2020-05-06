import Contest from "../../interfaces/Contest";

export const ContestCategories = [
  "ABC",
  "ARC",
  "AGC",
  "Other Rated Contests",
  "PAST",
  "JOI",
  "JAG",
  "Marathon",
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

  if (isRatedContest(contest)) {
    return "Other Rated Contests";
  }

  if (contest.id.startsWith("past")) {
    return "PAST";
  }
  if (contest.id.startsWith("joi")) {
    return "JOI";
  }
  if (contest.id.startsWith("jag")) {
    return "JAG";
  }
  if (
    contest.title.match(
      /(^Chokudai Contest|ハーフマラソン|^HACK TO THE FUTURE|Asprova)/
    ) ||
    contest.id.match(/(^future-meets-you-contest|^hokudai-hitachi)/) ||
    [
      "caddi2019",
      "pakencamp-2019-day2",
      "kuronekoyamato-contest2019",
      "wn2017_1"
    ].includes(contest.id)
  ) {
    return "Marathon";
  }

  return "Other Contests";
};

export const isRatedContest = (contest: Contest) => {
  return (
    contest.rate_change !== "-" && contest.start_epoch_second >= AGC_001_START
  );
};
