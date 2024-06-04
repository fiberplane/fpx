import { Hono } from "hono";
import { inArray, ne, desc } from "drizzle-orm";
import { cors } from "hono/cors";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

import type { Bindings, Variables } from "../lib/types";
import { tryParseJsonObjectMessage } from "../lib/utils";
import * as schema from "../db/schema";

const { mizuLogs } = schema;

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const schemaPostLogs = z.object({
  level: z.enum(["debug", "log", "info", "warn", "error"]).transform((val) => {
    if (val === "warn") return "warning";
    return val;
  }),
  service: z.string().optional(),
  message: z.any(),
  args: z.any(),
  traceId: z.string(),
  callerLocation: z
    .object({
      file: z.string(),
      line: z.string(),
      column: z.string(),
      method: z.string(),
    })
    .nullable(),
  timestamp: z.string(),
});

app.post("/v0/logs", zValidator("json", schemaPostLogs), async (c) => {
  const { level, service, message, args, traceId, callerLocation, timestamp } =
    c.req.valid("json");

  const db = c.get("db");
  const dbErrors = c.get("dbErrors");
  const parsedMessage = tryParseJsonObjectMessage(message);

  try {
    // Ideally would use `c.ctx.waitUntil` on sql call here but no need to optimize this project yet or maybe ever
    const mizuLevel = level === "log" ? "info" : level;
    await db.insert(mizuLogs).values({
      level: mizuLevel,
      service,
      message: parsedMessage,
      args,
      callerLocation,
      traceId,
      timestamp,
    });

    const wsConnections = c.get("wsConnections");

    if (wsConnections) {
      for (const ws of wsConnections) {
        const message = ["mizuTraces"];
        ws.send(JSON.stringify(message));
      }
    }

    return c.text("OK");
  } catch (err) {
    if (err instanceof Error) {
      console.log("DB ERROR FOR:", { message, parsedMessage });
      console.error(err);
      dbErrors.push(err);
    }
    return c.json({ error: "Error processing log data" }, 500);
  }
});

app.post(
  "/v0/logs/ignore",
  cors(),
  zValidator("json", z.object({ logIds: z.number().array() })),
  async (c) => {
    const { logIds } = c.req.valid("json");
    const db = c.get("db");
    const updatedLogIds = await db
      .update(mizuLogs)
      .set({ ignored: true })
      .where(inArray(mizuLogs.id, logIds));
    return c.json({ updatedLogIds });
  },
);

app.post("/v0/logs/delete-all-hack", cors(), async (c) => {
  const db = c.get("db");
  await db.delete(mizuLogs).where(ne(mizuLogs.id, 0));
  c.status(204);
  return c.res;
});

// Data equivalent of home page (for a frontend to consume)
app.get("/v0/logs", cors(), async (c) => {
  const showIgnored = !!c.req.query("showIgnored");
  const db = c.get("db");
  const logsQuery = showIgnored
    ? db.select().from(mizuLogs)
    : db.select().from(mizuLogs).where(ne(mizuLogs.ignored, true));
  const logs = await logsQuery.orderBy(desc(mizuLogs.timestamp));
  return c.json({
    // HACK - switching to drizzle meant renaming a bunch of fields oy vey
    logs: logs.map((l) => ({
      ...l,
      trace_id: l.traceId,
      created_at: l.createdAt,
      updated_at: l.updatedAt,
      caller_location: l.callerLocation,
      // message: tryParseJsonObjectMessage(l.message),
    })),
  });
});

export default app;
