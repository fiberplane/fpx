import { Hono } from "hono";
import { cors } from "hono/cors";
import * as db from "./db";
import { getProfile as getUserProfile } from "./db";

const app = new Hono();

app.get("/user/1/profile", cors(), async (c) => {
  const profile = await getUserProfile();
  return c.json(profile);
});

app.get("/user/1", cors(), async (c) => {
  const user = await db.getUser();
  return c.json(user);
});

export default app;
