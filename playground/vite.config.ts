import path from "node:path";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite(),
    svgr({
      svgrOptions: { exportType: "default", ref: true },
      include: "**/*.svg",
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 6660,
  },
  // TODO: Temporary to make sure we can load the assets from the fs using it's chunk name without a hash
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "index.js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
});
