import type {
  ESpanKind,
  EStatusCode,
  IAnyValue,
  IEvent,
  IExportTraceServiceRequest,
  IKeyValue,
  ILink,
  IStatus,
} from "@opentelemetry/otlp-transformer";
import { and, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import * as schema from "../db/schema.js";
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

type MizuSpan = {
  trace_id: string;
  span_id: string;
  parent_span_id: string | null;
  name: string;
  trace_state: string | null | undefined;
  kind: string;
  scope_name: string | null;
  scope_version: string | null | undefined;
  start_time: Date;
  end_time: Date;
  attributes: Record<string, AttributeValue>;
  scope_attributes: Record<string, AttributeValue> | null;
  resource_attributes: Record<string, AttributeValue> | null;
  status:
    | {
        code: EStatusCode;
        message: string;
      }
    | undefined;
  events: {
    name: string;
    timestamp: Date;
    attributes: Record<string, AttributeValue>;
  }[];
  links: {
    trace_id: string;
    span_id: string;
    trace_state: string | undefined;
    attributes: Record<string, AttributeValue>;
  }[];
};

/**
 * HACK - Port of the rust code that massages traces into the format we use in the UI.
 *
 * A few differences:
 *
 * - The otel js library does not expose `traceFlags` or `flags` from what I can tell,
 *   so that field is always blank.
 *
 * - `mapAttributes` simply returns the value, instead of an object whose key describes the attribute data type.
 *   By convention, we only use string and number values. Complex values are serialized.
 */
function fromCollectorRequest(tracesData: IExportTraceServiceRequest) {
  const result: Array<MizuSpan> = [];

  for (const resourceSpan of tracesData.resourceSpans ?? []) {
    const resourceAttributes = resourceSpan.resource
      ? mapAttributes(resourceSpan.resource.attributes)
      : null;

    for (const scopeSpan of resourceSpan.scopeSpans ?? []) {
      let scopeName = null;
      let scopeVersion = null;

      if (scopeSpan.scope) {
        scopeName = scopeSpan.scope.name;
        scopeVersion = scopeSpan.scope.version;
      }

      const scopeAttributes = scopeSpan.scope
        ? mapAttributes(scopeSpan.scope.attributes ?? [])
        : null;

      for (const span of scopeSpan.spans ?? []) {
        const kind = convertToSpanKind(span.kind);

        const attributes = mapAttributes(span.attributes);

        const startTime = new Date(Number(span.startTimeUnixNano) / 1e6);
        const endTime = new Date(Number(span.endTimeUnixNano) / 1e6);

        const parentSpanId = span.parentSpanId
          ? stringOrUintToString(span.parentSpanId)
          : null;

        const events = span.events.map((event) => mapEvent(event));
        const links = span.links.map((link) => mapLink(link));

        const traceId = stringOrUintToString(span.traceId);
        const spanId = stringOrUintToString(span.spanId);

        const name = span.name;
        const traceState = span.traceState;

        const spanInstance = {
          trace_id: traceId,
          span_id: spanId,
          parent_span_id: parentSpanId,
          name,
          trace_state: traceState,
          kind,
          scope_name: scopeName,
          scope_version: scopeVersion,
          start_time: startTime,
          end_time: endTime,
          attributes,
          scope_attributes: scopeAttributes,
          resource_attributes: resourceAttributes,
          status: span.status ? mapStatus(span.status) : undefined,
          events,
          links,
        };

        result.push(spanInstance);
      }
    }
  }

  return result;
}

type AttributeValuePrimitive = null | boolean | number | string | Uint8Array;
type AttributeValue =
  | AttributeValuePrimitive
  | AttributeValuePrimitive[]
  | Record<string, AttributeValuePrimitive>;

function mapAttributeValue(value: IAnyValue): AttributeValue {
  if (!value) return null;
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.boolValue !== undefined) return value.boolValue;
  if (value.intValue !== undefined) return value.intValue;
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.bytesValue !== undefined) return value.bytesValue;
  if (value.arrayValue !== undefined) {
    // @ts-expect-error - By convention we don't actually nest values so don't need a recursive type
    return value.arrayValue.values.map(mapAttributeValue);
  }
  if (value.kvlistValue !== undefined) {
    // @ts-expect-error - By convention we don't actually nest values so don't need a recursive type
    return mapAttributes(value.kvlistValue.values);
  }
  return null;
}

function mapAttributes(
  attributes: IKeyValue[],
): Record<string, AttributeValue> {
  const result: Record<string, AttributeValue> = {};
  for (const kv of attributes) {
    result[kv.key] = kv.value ? mapAttributeValue(kv.value) : null;
  }
  return result;
}

function mapEvent(event: IEvent) {
  return {
    name: event.name,
    timestamp: new Date(Number(event.timeUnixNano) / 1e6),
    attributes: mapAttributes(event.attributes),
  };
}

function mapLink(link: ILink) {
  return {
    trace_id: stringOrUintToString(link.traceId),
    span_id: stringOrUintToString(link.spanId),
    trace_state: link.traceState,
    attributes: mapAttributes(link.attributes),
  };
}

function stringOrUintToString(id: string | Uint8Array) {
  return id instanceof Uint8Array
    ? Buffer.from(id).toString("hex")
    : Buffer.from(id, "hex").toString("hex");
}

function mapStatus(status: IStatus) {
  return {
    code: status.code,
    message: status.message ?? statusCodeToString(status.code),
  };
}

function statusCodeToString(statusCode: EStatusCode) {
  switch (statusCode) {
    case 0:
      return "STATUS_CODE_UNSET";
    case 1:
      return "STATUS_CODE_OK";
    case 2:
      return "STATUS_CODE_ERROR";
    default:
      return "";
  }
}

// Function to convert ESpanKind to SpanKind
function convertToSpanKind(spanKind: ESpanKind): string {
  switch (spanKind) {
    case 1:
      return SpanKind.INTERNAL;
    case 2:
      return SpanKind.SERVER;
    case 3:
      return SpanKind.CLIENT;
    case 4:
      return SpanKind.PRODUCER;
    case 5:
      return SpanKind.CONSUMER;
    default:
      return "Unspecified";
  }
}

// NOTE - Copy-pasted
const SpanKind = {
  /** Default value. Indicates that the span is used internally. */
  INTERNAL: "Internal",
  /**
   * Indicates that the span covers server-side handling of an RPC or other
   * remote request.
   */
  SERVER: "Server",
  /**
   * Indicates that the span covers the client-side wrapper around an RPC or
   * other remote request.
   */
  CLIENT: "Client",
  /**
   * Indicates that the span describes producer sending a message to a
   * broker. Unlike client and server, there is no direct critical path latency
   * relationship between producer and consumer spans.
   */
  PRODUCER: "Producer",
  /**
   * Indicates that the span describes consumer receiving a message from a
   * broker. Unlike client and server, there is no direct critical path latency
   * relationship between producer and consumer spans.
   */
  CONSUMER: "Consumer",
};
