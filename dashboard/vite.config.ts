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
      "/v1": "http://localhost:6767",
    },
  },
});
