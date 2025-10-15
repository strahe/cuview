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
      importMode: "sync",
    }),
    vue(),
    tailwindcss(),
    checker({
      typescript: true,
      vueTsc: true,
      eslint: {
        lintCommand:
          "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts",
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
        manualChunks(id) {
          if (
            id.includes("node_modules/apexcharts") ||
            id.includes("node_modules/vue3-apexcharts")
          ) {
            return "apexcharts-vendor";
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
