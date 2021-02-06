import { Location } from "history";
import { ProblemId } from "../interfaces/Status";

export const generatePathWithParams = (
  location: Location,
  params: Record<string, string>
): string => {
  const searchParams = new URLSearchParams(location.search);
  Object.keys(params).forEach((key) => searchParams.set(key, params[key]));

  return `${location.pathname}?${searchParams.toString()}`;
};

export const separateSymbol = "~";

export const generateProblemIdsToString = (ids: ProblemId[] | undefined) => {
  if (!ids) return "";
  let qs = "";
  for (const id of ids) {
    if (qs.length > 0) qs += separateSymbol;
    qs += id;
  }
  return qs;
};
