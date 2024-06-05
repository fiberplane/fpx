import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { Bindings, Variables } from "@/lib/types";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const dependencySchema = z.object({
  name: z.string(),
  version: z.string(),
  repository: z.object({
    owner: z.string(),
    repo: z.string(),
    url: z.string(),
  }),
});

type Dependency = z.infer<typeof dependencySchema>;

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
