import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { getViteBasePath } from "./src/utils/router-base-path";

export default defineConfig({
  base: getViteBasePath(process.env.VITE_BASE_PATH),
  plugins: [
    TanStackRouterVite({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
      quoteStyle: "double",
      routeFileIgnorePattern: "\\.(test|spec)\\.(ts|tsx)$",
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "vendor-react",
              test: /node_modules[\\/](react|react-dom|react-is)[\\/]/,
              priority: 40,
            },
            {
              name: "vendor-tanstack",
              test: /node_modules[\\/]@tanstack[\\/]/,
              priority: 30,
            },
            {
              name: "vendor-ui",
              test: /node_modules[\\/](@base-ui|@radix-ui|cmdk|vaul)[\\/]/,
              priority: 25,
            },
            {
              name: "vendor-rjsf",
              test: /node_modules[\\/]@rjsf[\\/]/,
              priority: 25,
            },
            {
              name: "vendor-charts",
              test: /node_modules[\\/](recharts|d3-.+)[\\/]/,
              priority: 25,
            },
            {
              name: "vendor",
              test: /node_modules[\\/]/,
              maxSize: 900 * 1024,
              priority: 1,
            },
          ],
        },
      },
    },
  },
});
