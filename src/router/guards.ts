import type { NavigationGuardNext, RouteLocationNormalized } from "vue-router";
import { useConfigStore } from "@/stores/config";

export const configGuard = (
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const configStore = useConfigStore();

  // Initialize config from environment if not already done
  configStore.initializeFromEnv();

  // Allow access to setup page
  if (to.path === "/setup") {
    next();
    return;
  }

  // Allow access to root page (it will handle redirection)
  if (to.path === "/") {
    next();
    return;
  }

  // For all other routes, check if endpoint is configured
  if (!configStore.isConfigured) {
    next("/setup");
    return;
  }

  next();
};
