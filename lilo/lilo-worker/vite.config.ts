import build from "@hono/vite-build/cloudflare-workers";
import devServer from "@hono/vite-dev-server";
import cloudflareAdapter from "@hono/vite-dev-server/cloudflare";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  if (mode === "client") {
    return {
      build: {
        rollupOptions: {
          input: "./src/client/index.tsx",
          output: {
            entryFileNames: "assets/[name].js"
          }
        },
        outDir: "./public"
      }
    };
  }

  const entry = "./src/index.tsx";
  return {
    server: { port: 8787 },
    plugins: [
      devServer({ adapter: cloudflareAdapter, entry }),
      build({ entry })
    ]
  };
});