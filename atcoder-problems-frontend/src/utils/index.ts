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
export const caseInsensitiveUserId = (userId: string): string => {
  return userId.toLowerCase();
};

export const isAccepted = (result: string): boolean => result === "AC";
export const isValidResult = (result: string): boolean =>
  ["AC", "WA", "TLE", "CE", "RE", "MLE", "OLE", "QLE", "IE", "NG"].includes(
    result
  );

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

export function shuffleArray<T>(originalArray: T[], k?: number): T[] {
  const shuffledArray = [] as T[];
  const array = [...originalArray];
  const size = k === undefined ? array.length : Math.min(k, array.length);
  for (let i = 0; i < size; ++i) {
    const index = Math.floor(Math.random() * (array.length - i)) + i;
    shuffledArray.push(array[index]);
    array[index] = array[i];
  }
  return shuffledArray;
}

export const mapToObject = (
  map: Map<RatingColor, number>
): { [key: string]: number } =>
  Array.from(map.entries()).reduce(
    (l, [k, v]) => Object.assign(l, { [k]: v }),
    {} as { [key: string]: number }
  );
