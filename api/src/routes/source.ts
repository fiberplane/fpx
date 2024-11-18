import { Hono } from "hono";
import { cors } from "hono/cors";

import { findSourceFunctions } from "../lib/find-source-function/index.js";
import type { Bindings, Variables } from "../lib/types.js";
import logger from "../logger/index.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.post("/v0/source-function", cors(), async (ctx) => {
  const { handler, source } = ctx.req.query();

  try {
    const result = await findSourceFunctions(source, handler);
    return ctx.json({
      functionText: result?.[0]?.sourceFunction ?? null,
    });
  } catch (err) {
    logger.error("Could not find function in source", source);
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
