import type { IExportTraceServiceRequest } from "@opentelemetry/otlp-transformer";
import { and, desc, sql } from "drizzle-orm";
import { Hono } from "hono";
import * as schema from "../db/schema.js";
import { fromCollectorRequest } from "../lib/otel/index.js";
import { getSetting } from "../lib/settings/index.js";
import type { Bindings, Variables } from "../lib/types.js";
import logger from "../logger.js";
import { OtelSpanSchema, type TraceDetailSpansResponse, type TraceListResponse } from "@fiberplane/fpx-types";

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

  const fpxWorker = await getSetting(db, "fpxWorkerProxy");
  if (fpxWorker?.enabled && fpxWorker.baseUrl) {
    const response = await fetch(`${fpxWorker.baseUrl}/ts-compat/v1/traces`);
    const json = await response.json();
    return ctx.json(json);
  }

  const spans = await db.query.otelSpans.findMany({
    where: sql`inner->>'scope_name' = 'fpx-tracer'`,
    orderBy: desc(sql`inner->>'end_time'`),
  });

  const traceMap = new Map<string, Array<(typeof spans)[0]>>();

  for (const span of spans) {
    const traceId = span.inner.trace_id;
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

  const response: TraceListResponse = traces.map(({ traceId, spans }) => ({ traceId, spans: spans.map(({ inner }) => OtelSpanSchema.parse(inner)) }));

  return ctx.json(response);
});

/**
 * As of writing, this endpoint is used to fetch all spans for a given trace ID.
 *
 * This powers the details page of a trace in the UI.
 */
app.get("/v1/traces/:traceId/spans", async (ctx) => {
  const traceId = ctx.req.param("traceId");

  const db = ctx.get("db");

  const fpxWorker = await getSetting(db, "fpxWorkerProxy");
  if (fpxWorker?.enabled && fpxWorker.baseUrl) {
    const response = await fetch(
      `${fpxWorker.baseUrl}/ts-compat/v1/traces/${traceId}/spans`,
    );
    const json = await response.json();
    return ctx.json(json);
  }

  const traces = await db
    .select()
    .from(otelSpans)
    .where(
      and(
        sql`inner->>'scope_name' = 'fpx-tracer'`,
        sql`inner->>'trace_id' = ${traceId}`,
      ),
    );

  console.log(traces);
  console.log(sql`inner->>'trace_id' = '${traceId}'`);

  const response: TraceDetailSpansResponse = traces.map(({ inner }) => OtelSpanSchema.parse(inner));

  return ctx.json(response);
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

  const fpxWorker = await getSetting(db, "fpxWorkerProxy");
  if (fpxWorker?.enabled && fpxWorker.baseUrl) {
    const response = await fetch(`${fpxWorker.baseUrl}/v1/traces`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(body),
    });
    const json = await response.json();
    return ctx.json(json);
  }

  try {
    const tracesPayload = (await fromCollectorRequest(body)).map((span) => ({
      inner: OtelSpanSchema.parse(span),
      spanId: span.span_id,
      traceId: span.trace_id,
    } satisfies typeof otelSpans.$inferInsert));

    try {
      await db.insert(otelSpans).values(tracesPayload);
    } catch (error) {
      logger.error("Error inserting trace", error);
      return ctx.text("Error inserting trace", 500);
    }

    const wsConnections = ctx.get("wsConnections");
    if (wsConnections) {
      for (const ws of wsConnections) {
        ws.send(
          JSON.stringify({
            event: "trace_created",
            payload: ["mizuTraces"],
          }),
        );
      }
    }

    return ctx.text("OK");
  } catch (error) {
    logger.error("Error parsing trace data", error);
    return ctx.text("Error parsing trace data", 400);
  }
});

export default app;
