import type { IExportTraceServiceRequest } from "@opentelemetry/otlp-transformer";
import { and, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import * as schema from "../db/schema.js";
import { fromCollectorRequest } from "../lib/otel/index.js";
import type { Bindings, Variables } from "../lib/types.js";
import logger from "../logger.js";

const { otelSpans } = schema;

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * As of writing, this endpoint is used to fetch the root span (`span.name === "request"`)
 * for all spans in the database.
 *
 * This powers the table of traces in the UI.
 */
app.get("/v1/traces", async (ctx) => {
  const db = ctx.get("db");

  const spans = await db
    .select()
    .from(otelSpans)
    .where(and(sql`parsed_payload->>'scope_name' = 'fpx-tracer'`))
    .orderBy(desc(otelSpans.createdAt));

  const traceMap = new Map<string, Array<(typeof spans)[0]>>();

  for (const span of spans) {
    const traceId = span.traceId;
    if (!traceId) {
      continue;
    }
    if (!traceMap.has(traceId)) {
      traceMap.set(traceId, []);
    }
    traceMap.get(traceId)?.push(span);
  }

  const traces = Array.from(traceMap.entries()).map(([traceId, spans]) => ({
    traceId,
    spans,
  }));

  return ctx.json(traces);
});

/**
 * As of writing, this endpoint is used to fetch all spans for a given trace ID.
 *
 * This powers the details page of a trace in the UI.
 */
app.get("/v1/traces/:traceId/spans", async (ctx) => {
  const db = ctx.get("db");

  const traces = await db
    .select()
    .from(otelSpans)
    .where(
      and(
        sql`parsed_payload->>'scope_name' = 'fpx-tracer'`,
        eq(otelSpans.traceId, ctx.req.param("traceId")),
      ),
    );
  return ctx.json(traces);
});

app.post("/v1/traces/delete-all-hack", async (ctx) => {
  const db = ctx.get("db");
  await db.delete(otelSpans);
  return ctx.text("OK");
});

/**
 * Expects a JSON payload from otel middleware
 */
app.post("/v1/traces", async (ctx) => {
  const db = ctx.get("db");

  const body: IExportTraceServiceRequest = await ctx.req.json();

  try {
    const tracesPayload = fromCollectorRequest(body).map((span) => ({
      rawPayload: body,
      parsedPayload: span,
      spanId: span.span_id,
      traceId: span.trace_id,
    }));

    // TODO - Find a way to use a type guard
    try {
      await db.insert(otelSpans).values(tracesPayload);
    } catch (error) {
      logger.error("Error inserting trace", error);
      return ctx.text("Error inserting trace", 500);
    }

    return ctx.text("OK");
  } catch (error) {
    logger.error("Error parsing trace data", error);
    return ctx.text("Error parsing trace data", 400);
  }
});

export default app;
