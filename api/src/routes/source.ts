import { findSourceFunction } from "../lib/find-source-function.js";
import type { Bindings, Variables } from "../lib/types.js";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { readFileSync } from "node:fs";
import { SourceMapConsumer } from "source-map";
import { z } from "zod";

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
      const errIsError = err instanceof Error;
      const message = errIsError? err.message : "(unknown error)";
      const name = errIsError? err.name : "Error";
      console.error("Could not read source file", message);
      return ctx.json(
        { error: "Error reading file", name, message },
        500,
      );
    }
  },
);

app.post("/v0/source-function", cors(), async (ctx) => {
  const { handler, source } = ctx.req.query();

  try {
    const functionText = await findSourceFunction(source, handler);
    return ctx.json({ functionText });
  } catch (err) {
    console.error("Could not find function in source", source);
    const errIsError = err instanceof Error;
    const message = errIsError ? err.message : "(unknown error)";
    const name = errIsError ? err.name : "Error";
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

export default app;
