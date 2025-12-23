export type ThemeName = "light" | "dark";

export const themeConfig = {
  storageKey: "cuview-theme",
  defaultTheme: "light" as ThemeName,
  lightTheme: "light" as ThemeName,
  darkTheme: "dark" as ThemeName,
} as const;

export const isDarkTheme = (name: ThemeName): boolean => name === "dark";

export const getNextTheme = (current: ThemeName): ThemeName =>
  current === "dark" ? "light" : "dark";
