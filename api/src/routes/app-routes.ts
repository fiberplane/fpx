import { appRoutes } from "@/db/schema.js";
import { Hono } from "hono";
import type { Bindings, Variables } from "../lib/types.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.get("/v0/app-routes", async (ctx) => {
  const db = ctx.get("db");
  const routes = await db.select().from(appRoutes);
  return ctx.json(routes);
});

export default app;
