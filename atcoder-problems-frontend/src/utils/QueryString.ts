import { useLocation } from "react-router-dom";

type Location = ReturnType<typeof useLocation>;

export const generatePathWithParams = (
  location: Location,
  params: Record<string, string>
): string => {
  const searchParams = new URLSearchParams(location.search);
  Object.keys(params).forEach((key) => searchParams.set(key, params[key]));

  return `${location.pathname}?${searchParams.toString()}`;
};

export const PROBLEM_ID_SEPARATE_SYMBOL = "~";
