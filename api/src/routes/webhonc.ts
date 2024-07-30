import { Hono } from "hono";
import type { Bindings, Variables } from "../lib/types.js";
import { getWebHoncConnectionId } from "../lib/webhonc/store.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.get("/v0/webhonc_id", async (ctx) => {
  return ctx.json({ connectionId: getWebHoncConnectionId() });
});

app.get("/v0/webhonc_request/:id", async (ctx) => {
  const webhookRequests = ctx.get("webhookRequests");
  const { id } = ctx.req.param();

  const request = webhookRequests.get(id);

  if (!request) {
    return ctx.json({ error: "Webhook not found" }, 404);
  }

  return ctx.json(request);
});

export default app;
