import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import * as schema from "../db/schema";
import type { HatchApp } from "../types";
import {
  FILES_TO_MODIFY,
  // NOTE - Had to swap out Anthropic for OpenAI because of rate limiting concerns
  // buildWithAnthropic,
  buildWithAnthropicMock,
} from "./lib/ai/anthropic";
import { buildWithOpenAi } from "./lib/ai/openai";
import { isScaffoldAppToolParameters } from "./lib/ai/tools";
import {
  readProjectFiles,
  writeIndexFile,
  writeSchemaFile,
  writeSeedFile,
} from "./lib/project-files";
import { SchemaContextSchema } from "./lib/types";

const app = new Hono<HatchApp>();

/**
 * Retrieve files for a given sessionId
 */
app.get("/files/:sessionId", async (c) => {
  const { sessionId } = c.req.param();
  const files = await readProjectFiles(c.env.R2, sessionId);
  return c.json({ files });
});

/**
 * Creates files for a given prompt, and save those files in R2, using the sessionId as the key.
 * Returns the list of files that were created.
 */
app.post(
  "/build/:sessionId",
  zValidator(
    "json",
    z.object({
      prompt: z.string(),
      indexFile: z.string().nullish(),
      schemaFile: z.string().nullish(),
      schemaContext: SchemaContextSchema.nullish(),
      seedFile: z.string().nullish(),
    }),
  ),
  async (c) => {
    const logger = c.get("appLogger");

    // HACK - Set this true to return a mock response, not eat up API calls
    const USE_MOCK = false;
    if (USE_MOCK) {
      logger.warn("Using mock response for code generation");
    }

    const db = c.get("db");
    const sessionId = c.req.param("sessionId");
    const body = c.req.valid("json");
    const { prompt, indexFile, schemaFile, schemaContext, seedFile } = body;

    logger.debug("Project files:", {
      indexFile: indexFile ? "present" : "missing",
      schemaFile: schemaFile ? "present" : "missing",
      seedFile: seedFile ? "present" : "missing",
    });
    logger.debug(
      "Schema context:",
      schemaContext
        ? {
            type: schemaContext?.type,
            drizzleImport: schemaContext?.drizzleImport,
            vendor: schemaContext?.vendor,
          }
        : "missing",
    );

    const builder = USE_MOCK ? buildWithAnthropicMock : buildWithOpenAi;

    const result = await builder(
      {
        // apiKey: c.env.ANTHROPIC_API_KEY,
        apiKey: c.env.OPENAI_API_KEY,
        indexFile: indexFile || "<index file not provided />",
        schemaFile: schemaFile || "<schema file not provided />",
        schemaContext: schemaContext || null,
        seedFile: seedFile || "<seed file not provided />",
        userPrompt: prompt,
      },
      logger,
    );

    if (isScaffoldAppToolParameters(result)) {
      // Don't await this, so we can return a response sooner and don't block the user's response
      c.executionCtx.waitUntil(
        Promise.all([
          writeIndexFile(c.env.R2, sessionId, result.indexFile),
          writeSchemaFile(c.env.R2, sessionId, result.schemaFile),
          writeSeedFile(c.env.R2, sessionId, result.seedFile),
        ]),
      );
    } else {
      logger.error(
        "Failed to parse scaffold app tool parameter according to schema",
      );
      await db
        .insert(schema.sessions)
        .values({
          id: sessionId,
          prompt,
          data: {
            result,
            // NOTE - This is for future reference, if we change how and which files we modify
            filesModified: FILES_TO_MODIFY,
            schemaContext,
          },
          type: "error",
        })
        .returning();
      return c.json(
        { error: "Unparseable tool call response from Anthropic" },
        500,
      );
    }

    const [session] = await db
      .insert(schema.sessions)
      .values({
        id: sessionId,
        prompt,
        data: {
          // NOTE - This is for future reference, if we change how and which files we modify
          filesModified: FILES_TO_MODIFY,
          schemaContext,
        },
        type: "success",
      })
      .returning();
    return c.json({ result, session });
  },
);

export default app;
