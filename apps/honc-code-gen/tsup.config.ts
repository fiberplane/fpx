import { defineConfig } from "tsup";

const isDev = process.env.npm_lifecycle_event === "dev";

export default defineConfig({
  clean: true,
  entry: ["src/index.ts"],
  format: ["esm"],
  minify: false,
  target: "esnext",
  outDir: "playground-dist",
  onSuccess: isDev ? "node playground-dist/index.js" : "",
});
