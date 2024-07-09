import { Hono } from "hono";
import type { Bindings, Variables } from "../lib/types.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.post("/v0/traces", async (ctx) => {
  const text = await ctx.req.text();
  // console.log('traces', text.resourceSpans.length);
  console.log('text', text);
  // console.log("text", JSON.stringify(text, null, 2));
  return ctx.body(null);
});

export default app;
