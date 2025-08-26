import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";

export type Theme = "light" | "dark";

export const useLayoutStore = defineStore(
  "layout",
  () => {
    // State
    const sidebarCollapsed = ref(false);
    const searchVisible = ref(false);
    const notificationsVisible = ref(false);
    const theme = ref<Theme>("dark");

    // Computed
    const isDark = computed(() => theme.value === "dark");

    // Apply theme to document
    const applyTheme = (newTheme: Theme) => {
      document.documentElement.setAttribute("data-theme", newTheme);
    };

    // Watch for theme changes and apply them
    watch(theme, applyTheme, { immediate: true });

    // Actions
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
      theme.value = theme.value === "dark" ? "light" : "dark";
    }

    function setTheme(newTheme: Theme) {
      theme.value = newTheme;
    }

    return {
      // State
      sidebarCollapsed,
      searchVisible,
      notificationsVisible,
      theme,
      isDark,
      // Actions
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
