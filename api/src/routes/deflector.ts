import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { parkingLot } from "../lib/deflector/index.js";
import type { Bindings, Variables } from "../lib/types.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.post(
  "/v0/deflector",
  zValidator(
    "json",
    z.object({
      key: z.string(),
      value: z.string(),
    }),
  ),
  async (ctx) => {
    const { key, value } = ctx.req.valid("json");
    const fromCache = parkingLot.get(key);
    if (fromCache) {
      parkingLot.delete(key);
      const [parkedContext, resolve] = fromCache;
      resolve(parkedContext.json(JSON.parse(value)));
      return ctx.json({ result: "success" });
    }
    return ctx.json({ error: `Unknown key: ${key}` }, 404);
  },
);

export default app;
