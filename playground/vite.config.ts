import path from "node:path";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import svgr from "vite-plugin-svgr";

// The SPA, when running locally, needs to proxy requests to the embedded API sometimes
// It's nice to be able to configure this.
// E.g., if you're running a sample API on localhost:6242 instead of localhost:8787, you can set EMBEDDED_API_URL=http://localhost:6242/fp
// to make the SPA proxy requests to your local API with the @fiberplane/embedded package.
const EMBEDDED_API_URL =
  process.env.EMBEDDED_API_URL ?? "http://localhost:8787/fp";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfills({
      // include: [
      //   'node:util',
      // ]
    }),
    react(),
    TanStackRouterVite(),
    svgr({
      svgrOptions: { exportType: "default", ref: true },
      include: "**/*.svg",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 6660,
    proxy: {
      "/api": EMBEDDED_API_URL,
    },
  },
  // NOTE: Consistent filenames (without hashes) make sure we can load the assets via cdn (from @fiberplane/embedded)
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        entryFileNames: "index.js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
});
