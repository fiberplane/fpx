/**
 * This file is used to test the static analysis of a codebase
 * with a route defined in a sub-router
 */
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  console.log("Other Router");
  const url = new URL(c.req.url);
  return c.text(`Other Router: ${url}`);
});

export default app;
