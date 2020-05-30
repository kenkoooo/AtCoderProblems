import { List } from "immutable";

const userIdRegex = /[0-9a-zA-Z_]+/;
export const ATCODER_USER_REGEXP = new RegExp(`^${userIdRegex.source}$`);
export const ATCODER_RIVALS_REGEXP = new RegExp(
  `^\\s*(${userIdRegex.source})\\s*(,\\s*(${userIdRegex.source})\\s*)*$`
);

export const extractRivalsParam = (rivalsParam: string): string[] => {
  if (ATCODER_RIVALS_REGEXP.exec(rivalsParam)) {
    return rivalsParam
      .split(",")
      .map((rival) => rival.trim())
      .filter((rival) => rival.length > 0);
  } else {
    return [];
  }
};

export const normalizeUserId = (userId: string): string => {
  const trimmedUserId = userId.trim();
  return ATCODER_USER_REGEXP.exec(trimmedUserId) ? trimmedUserId : "";
};

export const isAccepted = (result: string): boolean => result === "AC";
export const isValidResult = (result: string): boolean =>
  ["AC", "WA", "TLE", "CE", "RE", "MLE", "OLE", "QLE", "IE", "NG"].includes(
    result
  );

export const isVJudgeOrLuogu = (userId: string): boolean => {
  return !!/^(vjudge\d|luogu_bot\d)$/.exec(userId);
};

export const ordinalSuffixOf = (i: number): "st" | "nd" | "rd" | "th" => {
  const j = i % 10;
  const k = i % 100;
  if (j === 1 && k !== 11) {
    return "st";
  }
  if (j === 2 && k !== 12) {
    return "nd";
  }
  if (j === 3 && k !== 13) {
    return "rd";
  }
  return "th";
};

export const clipDifficulty = (difficulty: number): number =>
  Math.round(
    difficulty >= 400 ? difficulty : 400 / Math.exp(1.0 - difficulty / 400)
  );

export const RatingColors = [
  "Grey",
  "Brown",
  "Green",
  "Cyan",
  "Blue",
  "Yellow",
  "Orange",
  "Red",
] as const;
export const ProblemColors = [
  "Black",
  "Grey",
  "Brown",
  "Green",
  "Cyan",
  "Blue",
  "Yellow",
  "Orange",
  "Red",
] as const;

export type RatingColor = typeof RatingColors[number];
export type ProblemColor = typeof ProblemColors[number];
export const getRatingColor = (rating: number): RatingColor => {
  const index = Math.min(Math.floor(rating / 400), RatingColors.length - 1);
  return RatingColors[index];
};
type RatingColorClassName =
  | "difficulty-grey"
  | "difficulty-brown"
  | "difficulty-green"
  | "difficulty-cyan"
  | "difficulty-blue"
  | "difficulty-yellow"
  | "difficulty-orange"
  | "difficulty-red";
export const getRatingColorClass = (rating: number): RatingColorClassName => {
  const ratingColor = getRatingColor(rating);
  switch (ratingColor) {
    case "Grey":
      return "difficulty-grey";
    case "Brown":
      return "difficulty-brown";
    case "Green":
      return "difficulty-green";
    case "Cyan":
      return "difficulty-cyan";
    case "Blue":
      return "difficulty-blue";
    case "Yellow":
      return "difficulty-yellow";
    case "Orange":
      return "difficulty-orange";
    case "Red":
      return "difficulty-red";
  }
};
export const getRatingColorCode = (ratingColor: RatingColor): string => {
  switch (ratingColor) {
    case "Grey":
      return "#808080";
    case "Brown":
      return "#804000";
    case "Green":
      return "#008000";
    case "Cyan":
      return "#00C0C0";
    case "Blue":
      return "#0000FF";
    case "Yellow":
      return "#C0C000";
    case "Orange":
      return "#FF8000";
    case "Red":
      return "#FF0000";
  }
};
export const getProblemColorCode = (problemColor: ProblemColor): string => {
  switch (problemColor) {
    case "Black":
      return "#101010";
    default:
      return getRatingColorCode(problemColor);
  }
};

export const shuffleList = (list: List<any>, k?: number): List<any> => {
  let shuffledList = List();
  const size = k === undefined ? list.size : Math.min(k, list.size);
  for (let i = 0; i < size; ++i) {
    const index = Math.floor(Math.random() * (list.size - i)) + i;
    shuffledList = shuffledList.push(list.get(index));
    list = list.set(index, list.get(i));
  }
  return shuffledList;
};
