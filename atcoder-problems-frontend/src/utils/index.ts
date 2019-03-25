export const ATCODER_USER_REGEXP = /^[0-9a-zA-Z_]+$/;
export const ATCODER_RIVALS_REGEXP = /^[a-zA-Z0-9_,]+$/;
export const isAccepted = (result: string) => result === "AC";
export const ordinalSuffixOf = (i: number) => {
  const j = i % 10;
  const k = i % 100;
  if (j == 1 && k != 11) {
    return "st";
  }
  if (j == 2 && k != 12) {
    return "nd";
  }
  if (j == 3 && k != 13) {
    return "rd";
  }
  return "th";
};
