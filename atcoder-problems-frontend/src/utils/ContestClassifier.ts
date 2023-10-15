import Contest from "../interfaces/Contest";
import { RatedTargetType, getRatedTarget } from "../components/ContestLink";

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
  "AHC",
  "Marathon",
  "Other Sponsored",
  "Other Contests",
] as const;
export type ContestCategory = typeof ContestCategories[number];

export const AGC_001_START = 1468670400;

export const isRatedContest = (
  contest: Contest,
  problemCount: number
): boolean => {
  return (
    contest.rate_change !== "-" &&
    contest.start_epoch_second >= AGC_001_START &&
    problemCount >= 2
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

export const classifyContest = (
  contest: Contest,
  problemCount = 100 // TODO: This function can not classify a non-AHC heuristic contest with this default parameter.
): ContestCategory => {
  if (/^abc\d{3}$/.exec(contest.id)) {
    return "ABC";
  }
  if (/^arc\d{3}$/.exec(contest.id)) {
    return "ARC";
  }
  if (/^agc\d{3}$/.exec(contest.id)) {
    return "AGC";
  }
  if (
    /^ahc\d{3}$/.exec(contest.id) ||
    ["toyota2023summer-final"].includes(contest.id)
  ) {
    return "AHC";
  }

  if (isRatedContest(contest, problemCount)) {
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
    /(^future-meets-you-contest|^hokudai-hitachi|^toyota-hc)/.exec(
      contest.id
    ) ||
    [
      "toyota2023summer-final-open",
      "genocon2021",
      "stage0-2021",
      "caddi2019",
      "pakencamp-2019-day2",
      "kuronekoyamato-contest2019",
      "wn2017_1",
    ].includes(contest.id)
  ) {
    return "Marathon";
  }
  if (
    /(ドワンゴ|^Mujin|SoundHound|^codeFlyer|^COLOCON|みんなのプロコン|CODE THANKS FESTIVAL)/.exec(
      contest.title
    ) ||
    /(CODE FESTIVAL|^DISCO|日本最強プログラマー学生選手権|全国統一プログラミング王|Indeed)/.exec(
      contest.title
    ) ||
    /(^Donuts|^dwango|^DigitalArts|^Code Formula|天下一プログラマーコンテスト|^Toyota)/.exec(
      contest.title
    )
  ) {
    return "Other Sponsored";
  }

  return "Other Contests";
};
