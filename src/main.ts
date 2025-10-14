import { createApp } from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import routes from "~pages";
import { configGuard } from "@/router/guards";
import "./style.css";
import App from "./App.vue";

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
});

// Apply configuration guard to all routes
router.beforeEach(configGuard);

// Set page title from route meta
router.afterEach((to) => {
  const baseTitle = "Cuview";

  if (to.meta?.title) {
    document.title = `${to.meta.title} - ${baseTitle}`;
  } else {
    // Fallback for routes without meta.title
    const segments = to.path.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];

    if (lastSegment && !lastSegment.includes("[")) {
      const title = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
      document.title = `${title} - ${baseTitle}`;
    } else if (to.name) {
      document.title = `${String(to.name)} - ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }
});

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);
app.use(pinia);
app.use(router);

router.isReady().then(() => {
  app.mount("#app");
});
