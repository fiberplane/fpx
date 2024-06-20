import { readFile } from "node:fs/promises";
import { zValidator } from "@hono/zod-validator";
import { desc, inArray, ne } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { SourceMapConsumer } from "source-map";
import { z } from "zod";

import * as schema from "../db/schema.js";
import type { Bindings, Variables } from "../lib/types.js";
import { tryParseJsonObjectMessage } from "../lib/utils.js";

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

app.post("/v0/logs", zValidator("json", schemaPostLogs), async (ctx) => {
  const { level, service, message, args, traceId, callerLocation, timestamp } =
    ctx.req.valid("json");

  const db = ctx.get("db");
  const dbErrors = ctx.get("dbErrors");
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

    const wsConnections = ctx.get("wsConnections");

    if (wsConnections) {
      for (const ws of wsConnections) {
        const message = ["mizuTraces"];
        ws.send(JSON.stringify(message));
      }
    }

    return ctx.text("OK");
  } catch (err) {
    if (err instanceof Error) {
      console.log("DB ERROR FOR:", { message, parsedMessage });
      console.error(err);
      dbErrors.push(err);
    }
    return ctx.json({ error: "Error processing log data" }, 500);
  }
});

app.post(
  "/v0/logs/ignore",
  cors(),
  zValidator("json", z.object({ logIds: z.number().array() })),
  async (ctx) => {
    const { logIds } = ctx.req.valid("json");
    const db = ctx.get("db");
    const updatedLogIds = await db
      .update(mizuLogs)
      .set({ ignored: true })
      .where(inArray(mizuLogs.id, logIds));
    return ctx.json({ updatedLogIds });
  },
);

app.post("/v0/logs/delete-all-hack", cors(), async (ctx) => {
  const db = ctx.get("db");
  await db.delete(mizuLogs).where(ne(mizuLogs.id, 0));
  ctx.status(204);
  return ctx.res;
});

// Data equivalent of home page (for a frontend to consume)
app.get("/v0/logs", cors(), async (ctx) => {
  const showIgnored = !!ctx.req.query("showIgnored");
  const db = ctx.get("db");
  const logsQuery = showIgnored
    ? db.select().from(mizuLogs)
    : db.select().from(mizuLogs).where(ne(mizuLogs.ignored, true));
  const logResults = await logsQuery.orderBy(desc(mizuLogs.timestamp));

  const logs = await Promise.all(
    logResults.map(async (l) => {
      const parsedResult = ErrorMessageSchema.safeParse(l.message);
      const stack =
        parsedResult.success &&
        parsedResult.data.stack &&
        (await transformStack(parsedResult.data.stack));

      const parsedMessage =
        stack && parsedResult.data
          ? {
              ...parsedResult.data,
              stack,
            }
          : l.message;

      return {
        ...l,
        trace_id: l.traceId,
        created_at: l.createdAt,
        updated_at: l.updatedAt,
        caller_location: l.callerLocation,
        message: parsedMessage,
      };
    }),
  );

  return ctx.json({
    // HACK - switching to drizzle meant renaming a bunch of fields oy vey
    logs,
  });
});

async function transformStack(stack: string) {
  const lines = stack.split("\n");

  const parsedLines = await Promise.all(
    lines.map(async (line) => {
      const regex =
        /at (?:(?<method>[^\s]+) \()?file:\/\/(?<file>[^\s]+):(?<lineNumber>\d+):(?<columnNumber>\d+)\)?/;

      const match = line.match(regex);
      if (!match || !match.groups) {
        return line;
      }

      const { method, file, lineNumber, columnNumber } = match.groups;

      const filePath = `${file.trim().replace("file://", "")}.map`;
      try {
        const fileData = await readFile(filePath, "utf8");
        const data = JSON.parse(fileData);
        const consumer = await new SourceMapConsumer(data);
        const pos = consumer.originalPositionFor({
          line: Number.parseInt(lineNumber, 10),
          column: Number.parseInt(columnNumber, 10),
        });
        consumer.destroy();
        if (pos.source) {
          const name = pos.name || method;
          return `${copyIndentation(line)}at ${name ? `${name.trim()} (` : ""}file://${pos.source}:${pos.line}:${pos.column}${name ? ")" : ""}`;
        }

        return line;
      } catch {
        return line;
      }
    }),
  );
  return parsedLines.join("\n");
}

function copyIndentation(source: string) {
  // Regular expression to match leading whitespace (spaces or tabs)
  const match = source.match(/^\s*/);

  // Extract the matched indentation
  const indentation = match ? match[0] : "";
  return indentation;
}

const ErrorMessageSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  name: z.string(),
});

export default app;
