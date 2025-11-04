import type { NavigationGuardNext, RouteLocationNormalized } from "vue-router";
import { useConfigStore } from "@/stores/config";

export const configGuard = (
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const configStore = useConfigStore();

  if (to.path === "/") {
    if (configStore.isConfigured) {
      next("/overview");
    } else {
      next("/setup");
    }
    return;
  }

  if (to.path === "/setup") {
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
