import { zValidator } from "@hono/zod-validator";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { logger as honoLogger } from "hono/logger";
import { z } from "zod";
import * as schema from "./db/schema";
import { buildWithAnthropic, buildWithAnthropicMock } from "./lib/ai/anthropic";
import { isScaffoldAppToolParameters } from "./lib/ai/tools";
import {
  readProjectFiles,
  writeIndexFile,
  writeSchemaFile,
  writeSeedFile,
} from "./lib/project-files";
import type { Bindings, Variables } from "./lib/types";
import { createLogger } from "./logger";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use(async (c, next) => {
  const logger = createLogger(c.env.HONC_LOG_LEVEL);
  c.set("appLogger", logger);
  await next();
});
// NOTE - This middleware adds `db` on the context so we don't have to initiate it every time
app.use(async (c, next) => {
  const db = drizzle(c.env.DB, { schema });
  c.set("db", db);
  await next();
});

app.use(async (c, next) => {
  try {
    await next();
  } catch (err) {
    const logger = c.get("appLogger");
    logger.error(err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Set up the builtin hono logger, but use debug logs from our logger
// This means users of the Honc++ cli will not see the request logs in their terminal,
// but if you want to see them locally, set `HONC_LOG_LEVEL=debug`
app.use((c, next) =>
  honoLogger((message: string, ...rest: string[]) => {
    const logger = c.get("appLogger");
    logger.debug(message, ...rest);
  })(c, next),
);

app.get("/", (c) => c.text("Hello, world!"));

app.get("/v0/files/:sessionId", async (c) => {
  const { sessionId } = c.req.param();
  const files = await readProjectFiles(c.env.R2, sessionId);
  return c.json({ files });
});

app.post(
  "/v0/build",
  zValidator(
    "json",
    z.object({
      prompt: z.string(),
      indexFile: z.string().optional(),
      schemaFile: z.string().optional(),
      seedFile: z.string().optional(),
      sessionId: z
        .string()
        .describe(
          "A unique identifier for the session, to correlate artifacts",
        ),
    }),
  ),
  async (c) => {
    const logger = c.get("appLogger");
    // HACK - Set this true to return a mock response, not eat up API calls
    const USE_MOCK = false;
    const body = c.req.valid("json");
    const { prompt, sessionId, indexFile, schemaFile, seedFile } = body;

    logger.debug("Project files:", {
      indexFile: indexFile ? "present" : "missing",
      schemaFile: schemaFile ? "present" : "missing",
      seedFile: seedFile ? "present" : "missing",
    });

    const builder = USE_MOCK ? buildWithAnthropicMock : buildWithAnthropic;

    const result = await builder(
      {
        indexFile: indexFile ?? "",
        schemaFile: schemaFile ?? "",
        seedFile: seedFile ?? "",
        userPrompt: prompt,
      },
      logger,
    );

    if (isScaffoldAppToolParameters(result)) {
      logger.debug("Writing files");
      logger.debug("Writing index file");
      await writeIndexFile(c.env.R2, sessionId, result.indexFile);
      logger.debug("Writing schema file");
      await writeSchemaFile(c.env.R2, sessionId, result.schemaFile);
      logger.debug("Writing seed file");
      await writeSeedFile(c.env.R2, sessionId, result.seedFile);
    } else {
      logger.error(
        "Failed to parse scaffold app tool parameter according to schema",
      );
      return c.json(
        { error: "Unparseable tool call response from Anthropic" },
        500,
      );
    }
    return c.json({ result });
  },
);

export default app;
