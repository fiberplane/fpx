import path from "node:path";
import { faviconsPlugin } from "@darkobits/vite-plugin-favicons";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: { exportType: "default", ref: true },
      include: "**/*.svg",
    }),
    faviconsPlugin({
      icons: { favicons: { source: "src/assets/fpx.svg" } },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // string shorthand: http://localhost:5173/v0 -> http://localhost:8788/v0
      "/v0": "http://localhost:8788",
      "/v1": "http://localhost:8788",
      // "/v1": "http://127.0.0.1:6767",
      // "/api/ws": "ws://127.0.0.1:6767",
      // "/api": "http://127.0.0.1:6767",
      "/ws": "ws://localhost:8788", // shorthand to get websocket working in dev
    },
  },
});
