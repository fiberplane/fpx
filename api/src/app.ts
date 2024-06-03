import { Hono } from "hono";
import { env } from "hono/adapter";
import { cors } from "hono/cors";
import { createClient } from "@libsql/client";
import { type LibSQLDatabase, drizzle } from 'drizzle-orm/libsql';
import { inArray, ne, desc } from "drizzle-orm";
import OpenAI from "openai";
import type { WebSocket } from "ws";

import * as schema from "./db/schema";

type Bindings = {
  DATABASE_URL: string;
  OPENAI_API_KEY: string;
};

type Variables = {
  db: LibSQLDatabase<typeof schema>
}

const { mizuLogs } = schema;

export function createApp(wsConnections?: Set<WebSocket>) {
  const app = new Hono<{ Bindings: Bindings, Variables: Variables }>();

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const DB_ERRORS: Array<any> = [];

  // NOTE - This middleware adds `db` on the context so we don't have to initiate it every time
  app.use(async (c, next) => {
    const sql = createClient({
      url: env(c).DATABASE_URL ?? 'file:mizu.db'
    })
    const db = drizzle(sql, { schema });

    c.set('db', db)

    await next();
  })

  app.use(async (c, next) => {
    try {
      await next();
    } catch (err) {
      console.error(err);
      return c.json({ error: "Internal server error" }, 500);
    }
  });

  app.post("/v0/logs", async (c) => {
    const {
      level,
      service,
      message,
      args,
      traceId,
      callerLocation,
      timestamp,
    } = await c.req.json();

    const db = c.get('db');
    const parsedMessage = tryParseJsonObjectMessage(message)

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
        DB_ERRORS.push(err);
      }
      return c.json({ error: "Error processing log data" }, 500);
    }
  });

  app.post("/v0/logs/ignore", cors(), async (c) => {
    const { logIds } = await c.req.json();
    const db = c.get('db');
    const updatedLogIds = await db
      .update(mizuLogs)
      .set({ ignored: true })
      .where(inArray(mizuLogs.id, logIds));
    return c.json({ updatedLogIds });
  });

  app.post("/v0/logs/delete-all-hack", cors(), async (c) => {
    const db = c.get('db');
    await db.delete(mizuLogs).where(ne(mizuLogs.id, 0));
    c.status(204);
    return c.res;
  });

  // Data equivalent of home page (for a frontend to consume)
  app.get("/v0/logs", cors(), async (c) => {
    const showIgnored = !!c.req.query("showIgnored");
    const db = c.get('db');
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

  app.post("/v0/analyze-error", cors(), async (c) => {
    const { handlerSourceCode, errorMessage } = await c.req.json();

    const openaiClient = new OpenAI({
      apiKey: c.env.OPENAI_API_KEY,
    });

    const response = await openaiClient.chat.completions.create({
      // NOTE - This model (should?) guarantee function calling to have json output
      model: "gpt-4o",
      // NOTE - We can restrict the response to be from this single tool call
      // tool_choice: {
      // 	type: "function",
      // 	function: { name: "extract_useful_queries" },
      // },
      messages: [
        {
          role: "system",
          content: `
            You are a code debugging assistant for apps that use Hono (web framework), 
            Neon (serverless postgres), Drizzle (ORM), and run on Cloudflare workers.
            You are given a function and an error message.
            Provide a succinct suggestion to fix the error, or say "I need more context to help fix this".
          `.trim(),
        },
        {
          role: "user",
          content: `
            I hit the following error: 
            ${errorMessage}
            This error originated in the following route handler for my Hono application:
            ${handlerSourceCode}
          `
            .trim()
            .split("\n")
            .map((l) => l.trim())
            .join("\n"),
        },
      ],
      temperature: 0,
      max_tokens: 2048,
    });

    const {
      // id: responseId,
      choices: [{ message }],
    } = response;

    return c.json({
      suggestion: message.content,
    });
  });

  // HACK - Route to inspect any db errors during this session
  app.get("db-errors", async (c) => {
    return c.json(DB_ERRORS);
  });

  return app;
}

/**
 * Hacky helper in case you want to try parsing a message as json, but want to fall back to its og value
 */
function tryParseJsonObjectMessage(str: unknown) {
  if (typeof str !== "string") {
    return str;
  }
  try {
    return JSON.parse(str);
  } catch (e) {
    return str;
  }
}