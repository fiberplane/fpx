import path from "node:path";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // string shorthand: http://localhost:5173/v0 -> http://localhost:8788/v0
      "/v0": "http://localhost:8788",
      "/ws": "ws://localhost:8788", // shorthand to get websocket working in dev
    },
  },
});
