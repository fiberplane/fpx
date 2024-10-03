import { readFileSync } from "node:fs";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { SourceMapConsumer } from "source-map";
import { z } from "zod";

import { findSourceFunctions } from "../lib/find-source-function/index.js";
import type { Bindings, Variables } from "../lib/types.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.get(
  "/v0/source",
  cors(),
  zValidator(
    "query",
    z.object({ source: z.string(), line: z.string(), column: z.string() }),
  ),
  async (ctx) => {
    const { source, line, column } = ctx.req.query();

    try {
      const file = JSON.parse(readFileSync(source, "utf8").toString());
      const consumer = await new SourceMapConsumer(file);
      const pos = consumer.originalPositionFor({
        line: Number.parseInt(line, 10),
        column: Number.parseInt(column, 10),
      });
      consumer.destroy();

      return ctx.json(pos);
    } catch (err) {
      const message = getValueFromObject(err, "message", "Unknown error");
      const name = getValueFromObject(err, "name", "");

      console.error("Could not read source file", message);
      return ctx.json(
        {
          error: "Error reading file",
          name,
          message,
        },
        500,
      );
    }
  },
);

app.post("/v0/source-function", cors(), async (ctx) => {
  const { handler, source } = ctx.req.query();

  try {
    const result = await findSourceFunctions(source, handler);
    return ctx.json({
      functionText: result?.sourceFunction ?? result?.sourceContent ?? null,
    });
  } catch (err) {
    console.error("Could not find function in source", source);
    const message = getValueFromObject(err, "message", "Unknown error");
    const name = getValueFromObject(err, "name", "");

    return ctx.json(
      {
        error: "Error finding function",
        name,
        message,
      },
      500,
    );
  }
});

function getValueFromObject<T>(
  element: unknown,
  key: string,
  defaultValue: T,
): T {
  if (typeof element === "object" && element !== null && key in element) {
    const value = (element as Record<string, unknown>)[key];
    // Rough check to see if the type of the value is the same as the default value
    if (typeof value === typeof defaultValue || value === defaultValue) {
      return (element as Record<string, unknown>)[key] as T;
    }
  }

  return defaultValue;
}

export default app;
