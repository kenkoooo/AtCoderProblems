import {List} from "immutable";

const userIdRegex = /[0-9a-zA-Z_]+/;
export const ATCODER_USER_REGEXP = new RegExp(`^${userIdRegex.source}$`);
export const ATCODER_RIVALS_REGEXP = new RegExp(
  `^\\s*(${userIdRegex.source})\\s*(,\\s*(${userIdRegex.source})\\s*)*$`
);

export const extractRivalsParam = (rivalsParam: string): string[] => {
  if (rivalsParam.match(ATCODER_RIVALS_REGEXP)) {
    return rivalsParam
      .split(",")
      .map(rival => rival.trim())
      .filter(rival => rival.length > 0);
  } else {
    return [];
  }
};

export const normalizeUserId = (userId: string): string => {
  const trimmedUserId = userId.trim();
  return trimmedUserId.match(ATCODER_USER_REGEXP) ? trimmedUserId : "";
};

export const isAccepted = (result: string) => result === "AC";
export const isValidResult = (result: string) =>
  ["AC", "WA", "TLE", "CE", "RE", "MLE", "OLE", "QLE", "IE", "NG"].includes(
    result
  );

export const ordinalSuffixOf = (i: number) => {
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

export const clipDifficulty = (difficulty: number) =>
  Math.round(
    difficulty >= 400 ? difficulty : 400 / Math.exp(1.0 - difficulty / 400)
  );

export const getRatingColorClass = (rating: number | null) => {
  if (rating === null) {
    return "";
  }
  if (rating < 400) {
    return "difficulty-grey";
  } else if (rating < 800) {
    return "difficulty-brown";
  } else if (rating < 1200) {
    return "difficulty-green";
  } else if (rating < 1600) {
    return "difficulty-cyan";
  } else if (rating < 2000) {
    return "difficulty-blue";
  } else if (rating < 2400) {
    return "difficulty-yellow";
  } else if (rating < 2800) {
    return "difficulty-orange";
  } else {
    return "difficulty-red";
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
