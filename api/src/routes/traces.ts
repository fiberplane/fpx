import { Hono } from "hono";
import type { Bindings, Variables } from "../lib/types.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.post("/v0/traces", async (ctx) => {
  const text = await ctx.req.text();
  console.log("text", text);
  return ctx.body(null);
});

export default app;
