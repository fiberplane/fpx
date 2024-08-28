import { instrument } from "@fiberplane/hono-otel";
import { serve } from "@hono/node-server";
import { config } from "dotenv";
import { Hono } from "hono";

config();

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: instrument(app.fetch),
  port,
});
