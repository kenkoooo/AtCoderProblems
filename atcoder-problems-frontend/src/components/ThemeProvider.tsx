import React from "react";
import { Helmet } from "react-helmet";
import { useLocalStorage } from "../utils/LocalStorage";
import { ThemeLight, ThemeDark, ThemePurple, Theme } from "../style/theme";

type ThemeId = "light" | "dark" | "purple";
type ThemeContextProps = [ThemeId, (newThemeId: ThemeId) => void];

const THEME_LIST = {
  light: ThemeLight,
  dark: ThemeDark,
  purple: ThemePurple,
};

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

  return THEME_LIST[themeId];
};
