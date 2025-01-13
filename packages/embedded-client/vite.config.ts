import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: "./src/index.tsx",
      formats: ["es"],
      fileName: "index",
    },
    outDir: "dist",
    rollupOptions: {
      output: {
        entryFileNames: "index.js",
      },
      external: ["hono", "@hono/zod-validator", "zod"],
    },
    target: "esnext",
  },
  define: {
    "process.env": "{}",
    "process.platform": null,
    "process.version": null,
  },
});
