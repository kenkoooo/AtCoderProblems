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
