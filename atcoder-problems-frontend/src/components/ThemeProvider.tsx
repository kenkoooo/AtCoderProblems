import React from "react";
import { Helmet } from "react-helmet";
import { useLocalStorage } from "../utils/LocalStorage";
import { ThemeLight, ThemeDark, ThemePurple, Theme } from "../style/theme";

type ThemeId = "light" | "dark" | "purple";
type ThemeContextProps = [ThemeId, (newThemeId: ThemeId) => void];

export const ThemeContext = React.createContext<ThemeContextProps>([
  "light",
  (): void => {
    throw new Error("setThemeId is not implemented.");
  },
]);

interface ThemeProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = (
  props: ThemeProviderProps
) => {
  const [themeId, setThemeId] = useLocalStorage<ThemeId>("theme", "light");

  return (
    <ThemeContext.Provider value={[themeId, setThemeId]}>
      <Helmet>
        <html className={`theme-${themeId}`} />
      </Helmet>

      {props.children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): Theme => {
  const [themeId] = React.useContext(ThemeContext);

  switch (themeId) {
    case "light":
      return ThemeLight;
    case "dark":
      return ThemeDark;
    case "purple":
      return ThemePurple;
  }
};
