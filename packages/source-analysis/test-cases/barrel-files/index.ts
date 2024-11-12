import { Hono } from "hono";
import { cors } from "hono/cors";
import { getUser } from "./db";

const app = new Hono();

// Endpoint that calls imported function from relative path
app.get("/user/1", cors(), async (c) => {
  // await getUser();
  const user = await getUser();
  return c.json(user);
});

app.get("/", (c) => c.text("Hello, Hono!"));

export default app;
