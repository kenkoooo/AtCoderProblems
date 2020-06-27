export const ThemeLight = {
  difficultyBlackColor: "#101010",
  difficultyGreyColor: "#808080",
  difficultyBrownColor: "#804000",
  difficultyGreenColor: "#008000",
  difficultyCyanColor: "#00C0C0",
  difficultyBlueColor: "#0000FF",
  difficultyYellowColor: "#C0C000",
  difficultyOrangeColor: "#FF8000",
  difficultyRedColor: "#FF0000",
  relativeDifficultyEasyColor: "#80FF80",
  relativeDifficultyModerateColor: "#FFFF80",
  relativeDifficultyDifficultColor: "#FF8080",
  relativeDifficultyBackgroundColor: "#C0C0C0",
};

export const ThemeDark: typeof ThemeLight = {
  ...ThemeLight,
  difficultyBlackColor: "#FFFFFF",
  difficultyGreyColor: "#C0C0C0",
  difficultyBrownColor: "#FFA244",
  difficultyGreenColor: "#3FAF3F",
  difficultyCyanColor: "#42E0E0",
  difficultyBlueColor: "#8888FF",
  difficultyYellowColor: "#FFFF56",
  difficultyOrangeColor: "#FFC86F",
  difficultyRedColor: "#FF6767",
  relativeDifficultyEasyColor: "#40C040",
  relativeDifficultyModerateColor: "#C0C040",
  relativeDifficultyDifficultColor: "#C04040",
  relativeDifficultyBackgroundColor: "#404040",
};

export type Theme = typeof ThemeLight;
