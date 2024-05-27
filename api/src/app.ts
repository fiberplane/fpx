import { Hono } from "hono";
import { env } from "hono/adapter";
import { cors } from "hono/cors";
import { NeonDbError, neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { inArray, ne, desc } from "drizzle-orm";
import OpenAI from "openai";
import { Endpoints } from "@octokit/types";
import { Octokit } from "octokit";
import { mizuLogs } from "./db/schema";
import { upgradeWebSocket } from "hono/cloudflare-workers";
import { WebSocket } from "ws";
import fs from "node:fs/promises";

type Bindings = {
  DATABASE_URL: string;
  OPENAI_API_KEY: string;
  GITHUB_TOKEN: string;
};

export function createApp(wsConnections?: Set<WebSocket>) {
  const app = new Hono<{ Bindings: Bindings }>();

  const DB_ERRORS: Array<NeonDbError> = [];

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
    const sql = neon(env(c).DATABASE_URL);
    const db = drizzle(sql);

    const jsonMessage = isJsonParseable(message)
      ? message
      : JSON.stringify(message);
    const jsonArgs = isJsonParseable(args) ? args : JSON.stringify(args);
    const jsonCallerLocation = isJsonParseable(callerLocation)
      ? callerLocation
      : JSON.stringify(callerLocation);

    try {
      // Ideally would use `c.ctx.waitUntil` on sql call here but no need to optimize this project yet or maybe ever
      const mizuLevel = level === "log" ? "info" : level;
      await sql(
        "insert into mizu_logs (level, service, message, args, caller_location, trace_id, timestamp) values ($1, $2, $3, $4, $5, $6, $7)",
        [
          mizuLevel,
          service,
          jsonMessage,
          jsonArgs,
          jsonCallerLocation,
          traceId,
          timestamp,
        ],
      );

      if (wsConnections) {
        for (const ws of wsConnections) {
          const message = ["mizuTraces"];
          ws.send(JSON.stringify(message));
        }
      }

      return c.text("OK");
    } catch (err) {
      if (err instanceof NeonDbError) {
        console.log("DB ERROR FOR:", { message, jsonMessage });
        console.error(err);
        DB_ERRORS.push(err);
      }
      return c.json({ error: "Error processing log data" }, 500);
    }
  });

  app.post("/v0/logs/ignore", cors(), async (c) => {
    const { logIds } = await c.req.json();
    const sql = neon(env(c).DATABASE_URL);
    const db = drizzle(sql);
    const updatedLogIds = await db
      .update(mizuLogs)
      .set({ ignored: true })
      .where(inArray(mizuLogs.id, logIds));
    return c.json({ updatedLogIds });
  });

  app.post("/v0/logs/delete-all-hack", cors(), async (c) => {
    const sql = neon(env(c).DATABASE_URL);
    const db = drizzle(sql);
    await db.delete(mizuLogs).where(ne(mizuLogs.id, 0));
    c.status(204);
    return c.res;
  });

  // Data equivalent of home page (for a frontend to consume)
  app.get("/v0/logs", cors(), async (c) => {
    const showIgnored = !!c.req.query("showIgnored");
    const sql = neon(env(c).DATABASE_URL);
    const db = drizzle(sql);
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

  app.get("/healthcheck", (c) => {
    return c.text("OK");
  });

  type Dependency = {
    name: string;
    version: string;
    repository: {
      owner: string;
      repo: string;
      url: string;
    };
  };

  app.get("/v0/dependencies", cors(), async (ctx) => {
    // pretend that this fetches and parses the package.json
    const data: Dependency[] = [
      {
        name: "hono",
        version: "4.3.11",
        repository: {
          owner: "honojs",
          repo: "hono",
          url: "https://github.com/honojs/hono",
        },
      },
    ];
    return ctx.json(data);
  });

  type OctokitResponse =
    Endpoints["GET /repos/{owner}/{repo}/issues"]["response"];
  type Issues = OctokitResponse["data"];

  // let issuesCache: Issues;

  app.get("/v0/github-issues/:owner/:repo", cors(), async (ctx) => {
    const CACHE_FILE_NAME = "issues-cache.json";

    let issuesCache: Issues;

    try {
      issuesCache = JSON.parse((await fs.readFile(CACHE_FILE_NAME)).toString());

      if (issuesCache) {
        return ctx.json(issuesCache);
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error("Issues cache is corrupted, ignoring");
      }
    }

    const octokit = new Octokit({
      auth: ctx.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN,
    });

    const owner = ctx.req.param("owner");
    const repo = ctx.req.param("repo");

    console.log("Fetching issues");

    const response = await octokit.paginate(
      `GET /repos/${owner}/${repo}/issues?state=all`,
      {
        owner,
        repo,
      },
    );

    console.log("Issues fetched, writing to cache and returning");
    await fs.writeFile(CACHE_FILE_NAME, JSON.stringify(response));

    return ctx.json(response);
  });

  // HACK - Route to inspect any db errors during this session
  app.get("db-errors", async (c) => {
    return c.json(DB_ERRORS);
  });

  // TODO - Otel support, would need to decode protobuf
  app.post("/v1/logs", async (c) => {
    const body = await c.req.json();
    console.log(body);
    return c.json(body);
  });

  return app;
}

/**
 * Check if value is json-parseable
 */
function isJsonParseable(str: string) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}
