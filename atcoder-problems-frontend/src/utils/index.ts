import { List } from "immutable";
import { Theme, ThemeLight } from "../style/theme";

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
export const getRatingColor = (rating: number): RatingColor => {
  const index = Math.min(Math.floor(rating / 400), RatingColors.length - 2);
  return RatingColors[index + 1];
};
export type RatingColorClassName =
  | "difficulty-black"
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
    case "Black":
      return "difficulty-black";
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
export const getRatingColorCode = (
  ratingColor: RatingColor,
  theme: Theme = ThemeLight
): string => {
  switch (ratingColor) {
    case "Black":
      return theme.difficultyBlackColor;
    case "Grey":
      return theme.difficultyGreyColor;
    case "Brown":
      return theme.difficultyBrownColor;
    case "Green":
      return theme.difficultyGreenColor;
    case "Cyan":
      return theme.difficultyCyanColor;
    case "Blue":
      return theme.difficultyBlueColor;
    case "Yellow":
      return theme.difficultyYellowColor;
    case "Orange":
      return theme.difficultyOrangeColor;
    case "Red":
      return theme.difficultyRedColor;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export const mapToObject = (map: Map<RatingColor, number>): {} =>
  Array.from(map.entries()).reduce(
    (l, [k, v]) => Object.assign(l, { [k]: v }),
    {}
  );
