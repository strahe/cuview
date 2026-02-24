import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  COLOR_THEME_KEY,
  type ColorTheme,
  DEFAULT_COLOR_THEME,
  getColorTheme,
} from "@/lib/color-themes";

type ThemeName = "light" | "dark";

interface LayoutContextValue {
  sidebarCollapsed: boolean;
  theme: ThemeName;
  isDark: boolean;
  colorTheme: string;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: ThemeName) => void;
  setColorTheme: (name: string) => void;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

const SIDEBAR_KEY = "cuview-sidebar-collapsed";
const THEME_KEY = "cuview-theme";

function getInitialTheme(): ThemeName {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;

  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

function getInitialColorTheme(): string {
  return localStorage.getItem(COLOR_THEME_KEY) ?? DEFAULT_COLOR_THEME;
}

function applyThemeToDOM(theme: ThemeName) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

const COLOR_THEME_CSS_PROPS = [
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
];

function applyColorThemeToDOM(ct: ColorTheme | undefined, isDark: boolean) {
  const root = document.documentElement;
  if (!ct || Object.keys(ct.cssVars.light).length === 0) {
    for (const prop of COLOR_THEME_CSS_PROPS) {
      root.style.removeProperty(prop);
    }
    return;
  }
  const vars = isDark ? ct.cssVars.dark : ct.cssVars.light;
  for (const prop of COLOR_THEME_CSS_PROPS) {
    if (vars[prop]) {
      root.style.setProperty(prop, vars[prop]);
    } else {
      root.style.removeProperty(prop);
    }
  }
}

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(() => {
    return localStorage.getItem(SIDEBAR_KEY) === "true";
  });

  const [theme, setThemeState] = useState<ThemeName>(getInitialTheme);
  const [colorTheme, setColorThemeState] =
    useState<string>(getInitialColorTheme);

  useEffect(() => {
    applyThemeToDOM(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    applyColorThemeToDOM(getColorTheme(colorTheme), theme === "dark");
    localStorage.setItem(COLOR_THEME_KEY, colorTheme);
  }, [colorTheme, theme]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsedState((prev) => !prev);
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const setTheme = useCallback((newTheme: ThemeName) => {
    setThemeState(newTheme);
  }, []);

  const setColorTheme = useCallback((name: string) => {
    setColorThemeState(name);
  }, []);

  return (
    <LayoutContext.Provider
      value={{
        sidebarCollapsed,
        theme,
        isDark: theme === "dark",
        colorTheme,
        toggleSidebar,
        setSidebarCollapsed,
        toggleTheme,
        setTheme,
        setColorTheme,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout(): LayoutContextValue {
  const ctx = useContext(LayoutContext);
  if (!ctx) {
    throw new Error("useLayout must be used within LayoutProvider");
  }
  return ctx;
}
