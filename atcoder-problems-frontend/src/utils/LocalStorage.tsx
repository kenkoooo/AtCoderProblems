import React from "react";

// Restrict the key of LocalStorage to avoid conflicting
const LocalStorageKeys = [
  "theme",
  "contestTableTab",
  "showDifficulty",
  "colorMode",
  "showPenalties",
  "hideCompletedContest",
  "dailyEffortBarChartActiveTab",
  "dailyEffortYRange",
  "climbingLineChartActiveTab",
  "climbingLineChartReverseColorOrder",
  "pinMe",
  "showRating",
  "recommendOption",
  "recommendExperimental",
  "recommendMergeLikeContest",
  "recoomendExcludeOption",
  "recommendCategoryOption",
  "MergeLikeContest",
] as const;
type LocalStorageKey = typeof LocalStorageKeys[number];

export function useLocalStorage<T>(
  key: LocalStorageKey,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const a = localStorage.getItem(key);
  const [value, setValue] = React.useState(
    a ? (JSON.parse(a) as T) : defaultValue
  );

  React.useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [value, key]);

  return [value, setValue];
}
