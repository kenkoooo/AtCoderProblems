import React from "react";
import { Helmet } from "react-helmet";
import { useLocalStorage } from "../utils/LocalStorage";
import { ThemeLight, ThemeDark, ThemePurple, Theme } from "../style/theme";

type RenderedThemeId = "light" | "dark" | "purple";
type ThemeId = RenderedThemeId | "auto";
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

  const helmet =
    themeId == "auto" ? (
      <AutoThemeHelmet />
    ) : (
      <Helmet>
        <html className={`theme-${themeId}`} />
      </Helmet>
    );

  return (
    <ThemeContext.Provider value={[themeId, setThemeId]}>
      {helmet}

      {props.children}
    </ThemeContext.Provider>
  );
};

function AutoThemeHelmet() {
  const [renderedThemeId, setRenderedThemeId] = React.useState<RenderedThemeId>(
    findRenderedThemeIdOfAuto()
  );

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e: MediaQueryListEvent) =>
      setRenderedThemeId(e.matches ? "dark" : "light")
    );

  return (
    <Helmet>
      <html className={`theme-${renderedThemeId}`} />
    </Helmet>
  );
}

export const useTheme = (): Theme => {
  const [themeId] = React.useContext(ThemeContext);
  return THEME_LIST[findRenderedThemeIdOf(themeId)];
};

const findRenderedThemeIdOf = (themeId: ThemeId): RenderedThemeId =>
  themeId == "auto" ? findRenderedThemeIdOfAuto() : themeId;

const findRenderedThemeIdOfAuto = (): RenderedThemeId =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
