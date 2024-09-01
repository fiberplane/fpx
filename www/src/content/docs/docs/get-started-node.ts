import { instrument } from "@fiberplane/hono-otel";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { config } from "dotenv";

// Load environment variables from .env file
// You need this to load the `FPX_ENDPOINT` variable!
config();

const app = new Hono();

app.get("/", (c) => c.text("Hello Hono!"));

serve({
  // This is the important line!
  // Wrap `app` with `instrument` before serving
  fetch: instrument(app).fetch,
  port: 3000,
});
