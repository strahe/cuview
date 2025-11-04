import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import {
  isDarkTheme,
  isThemeName,
  themeConfig,
  type ThemeName,
} from "@/lib/theme";

const readStoredTheme = (): ThemeName | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(themeConfig.storageKey);
  return isThemeName(stored) ? stored : null;
};

const resolveInitialTheme = (): ThemeName => {
  const storedTheme = readStoredTheme();
  if (storedTheme) {
    return storedTheme;
  }

  if (typeof window !== "undefined") {
    const prefersDark = window.matchMedia?.(
      "(prefers-color-scheme: dark)",
    )?.matches;

    if (prefersDark) {
      return themeConfig.darkTheme;
    }
  }

  return themeConfig.defaultTheme;
};

const applyTheme = (value: ThemeName) => {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", value);
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(themeConfig.storageKey, value);
  }
};

export const useLayoutStore = defineStore(
  "layout",
  () => {
    const sidebarCollapsed = ref(false);
    const searchVisible = ref(false);
    const notificationsVisible = ref(false);
    const theme = ref<ThemeName>(
      typeof window === "undefined"
        ? themeConfig.defaultTheme
        : resolveInitialTheme(),
    );

    const isDark = computed(() => isDarkTheme(theme.value));

    if (typeof window !== "undefined") {
      watch(
        theme,
        (value) => {
          applyTheme(value);
        },
        { immediate: true },
      );
    }

    function toggleSidebar() {
      sidebarCollapsed.value = !sidebarCollapsed.value;
    }

    function toggleSearch() {
      searchVisible.value = !searchVisible.value;
    }

    function toggleNotifications() {
      notificationsVisible.value = !notificationsVisible.value;
    }

    function setSidebarCollapsed(collapsed: boolean) {
      sidebarCollapsed.value = collapsed;
    }

    function toggleTheme() {
      const nextTheme =
        theme.value === themeConfig.darkTheme
          ? themeConfig.lightTheme
          : themeConfig.darkTheme;

      setTheme(nextTheme);
    }

    function setTheme(newTheme: ThemeName) {
      theme.value = newTheme;
    }

    return {
      sidebarCollapsed,
      searchVisible,
      notificationsVisible,
      theme,
      isDark,
      toggleSidebar,
      toggleSearch,
      toggleNotifications,
      setSidebarCollapsed,
      toggleTheme,
      setTheme,
    };
  },
  {
    persist: {
      pick: ["sidebarCollapsed", "theme"],
    },
  },
);
