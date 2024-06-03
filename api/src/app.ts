import { Hono } from "hono";
import { env } from "hono/adapter";
import { cors } from "hono/cors";
import { NeonDbError, neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { inArray, ne, desc } from "drizzle-orm";
import OpenAI from "openai";
import { Octokit } from "octokit";
import { mizuLogs } from "./db/schema";
import { WebSocket } from "ws";
import { GitHubIssue } from "./types";
import { getEmbedder } from "./embeddings";
import { getGithubIssues } from "./github-service";
import { getProjectDependencies } from "./dependencies";
import { AnyOrama, search } from "@orama/orama";
import { assert } from "./utils";

type Bindings = {
  DATABASE_URL: string;
  OPENAI_API_KEY: string;
  GITHUB_TOKEN: string;
};

export function createApp(
  wsConnections?: Set<WebSocket>,
  embeddingsDb?: AnyOrama,
) {
  const app = new Hono<{ Bindings: Bindings }>();

  type Match = {
    title: string;
    body: string;
    url: string;
  };

  const errorIssueMatches = new Map<string, Match>();

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

    const parsed = isJsonParseable(jsonMessage)
      ? JSON.parse(jsonMessage)
      : undefined;
    if (parsed && "stack" in parsed) {
      const embedder = await getEmbedder();

			console.log("PARSED", parsed);

      const searchVector = (
        await embedder(parsed.stack, {
          pooling: "mean",
          normalize: true,
        })
      )
        .tolist()
        .flat();

      assert(embeddingsDb, "embeddingsDb is undefined");
      assert(
        searchVector,
        (v): v is number[] =>
          Array.isArray(v) && v.length > 0 && typeof v[0] === "number",
        "searchVector is not a vector",
      );

      const results = await search(embeddingsDb, {
        mode: "vector",
        vector: { value: searchVector, property: "embedding" },
        similarity: 0.5,
        limit: 3,
      });

			console.log("RESULTS", results);

      const matchingIssues = results.hits.map((hit) => {
        return hit.document;
      });

      assert(
        traceId,
        (t): t is string => typeof t === "string",
        "traceId is not a string",
      );

      errorIssueMatches.set(traceId, matchingIssues);
    }

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
          ws.send(JSON.stringify(["mizuTraces"]));
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

  app.get("/v0/issues/:id", cors(), async (c) => {
    const id = c.req.param("id");
    const matchingIssues = errorIssueMatches.get(id);
		console.log("errorIssueMatches", errorIssueMatches);
		console.log("MATCHING ISSUES", matchingIssues);
    if (!matchingIssues) {
      return c.json([]);
    }
    return c.json(matchingIssues);
  });

  app.get("/v0/dependencies", cors(), async (ctx) => {
    const deps = getProjectDependencies();
    return ctx.json(deps);
  });

  app.get("/v0/github-issues/:owner/:repo", cors(), async (ctx) => {
    const owner = ctx.req.param("owner");
    const repo = ctx.req.param("repo");
    const gitHubtoken = ctx.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN || "";

    const issues = await getGithubIssues(gitHubtoken, owner, repo);
    return ctx.json(issues);
  });

  app.get("/v0/priority-issues", cors(), async (ctx) => {});

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
