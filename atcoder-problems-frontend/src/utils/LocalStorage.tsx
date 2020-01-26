import React from "react";

export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const a = localStorage.getItem(key);
  const [value, setValue] = React.useState(
    a ? (JSON.parse(a) as T) : defaultValue
  );

  React.useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [value]);

  return [value, setValue];
}
