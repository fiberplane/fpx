import { Hono } from "hono";
import type { Bindings, Variables } from "../lib/types.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// NOTE: hardcoded for now for simplicity, will eventually dynamically
// parse the package.json file
app.get("/v0/dependencies", async (ctx) => {
  return ctx.json([
    {
      name: "hono",
      version: "4.3.11",
      repository: {
        owner: "honojs",
        repo: "hono",
        url: "https://github.com/honojs/hono",
      },
    },
    {
      name: "@neondatabase/serverless",
      version: "0.9.3",
      repository: {
        owner: "neondatabase",
        repo: "serverless",
        url: "https://github.com/neondatabase/serverless",
      },
    },
  ]);
});

export default app;
