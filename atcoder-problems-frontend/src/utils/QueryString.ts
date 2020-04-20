import { Location } from "history";

export const generatePathWithParams = (
  location: Location,
  params: Record<string, string>
): string => {
  const searchParams = new URLSearchParams(location.search);
  Object.keys(params).forEach(key => searchParams.set(key, params[key]));

  return `${location.pathname}?${searchParams.toString()}`;
};
