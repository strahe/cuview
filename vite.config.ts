import path from "node:path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import VueRouter from "unplugin-vue-router/vite";
import checker from "vite-plugin-checker";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    VueRouter({
      routesFolder: [
        {
          src: "src/pages",
          path: "",
          exclude: ["**/components/**/*.vue"],
        },
      ],
      extensions: [".vue"],
      dts: "./typed-router.d.ts",
    }),
    vue(),
    tailwindcss(),
    checker({
      typescript: true,
      vueTsc: true,
      eslint: {
        lintCommand: "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts",
        watchPath: "./src",
        useFlatConfig: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vue-core": ["vue", "vue-router"],
          "vue-state": ["pinia", "pinia-plugin-persistedstate"],
          "vue-use": ["@vueuse/core"],
          "apexcharts-vendor": ["apexcharts", "vue3-apexcharts"],
          "table-vendor": ["@tanstack/vue-table"],
          "ui-vendor": ["reka-ui", "@heroicons/vue", "daisyui"],
          "date-vendor": ["date-fns"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
