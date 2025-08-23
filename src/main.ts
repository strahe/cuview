import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import routes from "~pages";
import { configGuard } from "@/router/guards";
import "./style.css";
import App from "./App.vue";

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Apply configuration guard to all routes
router.beforeEach(configGuard);

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);
app.use(pinia);
app.use(router);
app.mount("#app");
