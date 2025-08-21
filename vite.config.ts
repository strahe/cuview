import path from "node:path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import Pages from "vite-plugin-pages";
import checker from "vite-plugin-checker";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    Pages({
      dirs: "src/pages",
      extensions: ["vue"],
    }),
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
});
