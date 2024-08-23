import { instrument } from "@fiberplane/hono-otel";
import { Hono } from "hono";
import { env } from "hono/adapter";

const app = new Hono<{ Bindings: { FPX_ENDPOINT: string } }>();

app.get("/", (c) => {
  console.log("hi", env(c).FPX_ENDPOINT);
  return c.text("Hello Hono!");
});

/**
 * Route that echoes the request headers
 * Useful for testing the OTel instrumentation passes through headers correctly
 *
 * https://linear.app/fiberplane/issue/FP-4020/otel-instrumentation-are-we-eating-the-incoming-request-headers
 */
app.get("/headers", (c) => {
  return c.text(JSON.stringify(c.req.raw.headers));
});

/**
 * Route that fetches a random cat image from the cat API
 * and returns it
 */
app.get("/cat", async (c) => {
  const response = await fetch("https://api.thecatapi.com/v1/images/search");
  const data = await response.json();
  return c.json(data);
});

export default instrument(app);
