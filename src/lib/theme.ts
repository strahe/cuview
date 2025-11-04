export const themeDefinitions = [
  { name: "light", label: "Light mode", isDark: false, isDefault: true },
  { name: "dark", label: "Dark mode", isDark: true, isDefault: false },
] as const;

type ThemeDefinition = (typeof themeDefinitions)[number];
export type ThemeName = ThemeDefinition["name"];

const fallbackTheme = themeDefinitions[0];

const lightThemeDefinition =
  themeDefinitions.find((definition) => definition.isDark === false) ??
  fallbackTheme;
const darkThemeDefinition =
  themeDefinitions.find((definition) => definition.isDark === true) ??
  lightThemeDefinition;
const defaultThemeDefinition =
  themeDefinitions.find((definition) => definition.isDefault) ??
  lightThemeDefinition;

const themeDefinitionMap = Object.fromEntries(
  themeDefinitions.map((definition) => [definition.name, definition]),
) as Record<ThemeName, ThemeDefinition>;

const orderedThemes = Array.from(
  new Set<ThemeName>([lightThemeDefinition.name, darkThemeDefinition.name]),
);

export const themeConfig = {
  storageKey: "theme",
  definitions: themeDefinitions,
  order: orderedThemes,
  defaultTheme: defaultThemeDefinition.name,
  lightTheme: lightThemeDefinition.name,
  darkTheme: darkThemeDefinition.name,
} as const;

export const isThemeName = (value: unknown): value is ThemeName =>
  typeof value === "string" && value in themeDefinitionMap;

export const getThemeDefinition = (name: ThemeName): ThemeDefinition =>
  themeDefinitionMap[name] ?? themeDefinitionMap[themeConfig.defaultTheme];

export const isDarkTheme = (name: ThemeName): boolean =>
  getThemeDefinition(name).isDark === true;

export const getNextTheme = (current: ThemeName): ThemeName =>
  current === themeConfig.darkTheme
    ? themeConfig.lightTheme
    : themeConfig.darkTheme;
