import { Hono } from "hono";
const app = new Hono();
app.get("/", (c) => {
  return c.json({});
})
app.post("/", (c) => c.json({ "hello": "world" }));
export { Hono } from "hono";
