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
import { Hono } from "hono";
import * as schema from "../db/schema.js";
import type { Bindings, Variables } from "../lib/types.js";
import logger from "../logger.js";

const { otelTraces } = schema;

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.get("/v1/traces", async (ctx) => {
  const db = ctx.get("db");
  const traces = await db.select().from(otelTraces);
  return ctx.json(traces);
});

/**
 * Expects a JSON payload from otel middleware
 */
app.post("/v1/traces", async (ctx) => {
  const db = ctx.get("db");

  const body: IExportTraceServiceRequest = await ctx.req.json();
  // console.log("RAW TRACE", JSON.stringify(body, null, 2));

  const tracesPayload = fromCollectorRequest(body)[0];
  // console.log("PAYLOAD", JSON.stringify(tracesPayload, null, 2));

  const traceId = crypto.randomUUID();

  try {
    await db.insert(otelTraces).values({
      traceId,
      rawPayload: body,
      parsedPayload: tracesPayload,
    });
  } catch (error) {
    logger.error("Error inserting trace", error);
  }

  return ctx.text("OK");
});

export default app;

/**
 * TODO
 * - [ ] Check if ISpan.attributes is same as IResource.attributes and IInstrumentationScope.attributes
 */
function fromCollectorRequest(tracesData: IExportTraceServiceRequest) {
  const result = [];

  tracesData.resourceSpans?.forEach((resourceSpan) => {
    const resourceAttributes = resourceSpan.resource
      ? mapAttributes(resourceSpan.resource.attributes)
      : null;

    resourceSpan.scopeSpans.forEach((scopeSpan) => {
      let scopeName = null;
      let scopeVersion = null;

      if (scopeSpan.scope) {
        scopeName = scopeSpan.scope.name;
        scopeVersion = scopeSpan.scope.version;
      }

      const scopeAttributes = scopeSpan.scope
        ? mapAttributes(scopeSpan.scope.attributes)
        : null;

      scopeSpan.spans?.forEach((span) => {
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

        // FIXME
        const flags = span.flags;

        const spanInstance = {
          trace_id: traceId,
          span_id: spanId,
          parent_span_id: parentSpanId,
          name,
          trace_state: traceState,
          flags,
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
      });
    });
  });

  return result;
}

function mapAttributes(attributes: IKeyValue[]) {
  const result = {};
  attributes?.forEach((kv) => {
    result[kv.key] = kv.value ? mapAttributeValue(kv.value) : null;
  });
  return result;
}

function mapAttributeValue(value: IAnyValue) {
  if (!value) return null;
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.boolValue !== undefined) return value.boolValue;
  if (value.intValue !== undefined) return value.intValue;
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.bytesValue !== undefined) return value.bytesValue;
  if (value.arrayValue !== undefined)
    return value.arrayValue.values.map(mapAttributeValue);
  if (value.kvlistValue !== undefined)
    return mapAttributes(value.kvlistValue.values);
  return null;
}

function mapEvent(event: IEvent) {
  return {
    name: event.name,
    timestamp: new Date(Number(event.timeUnixNano) / 1e6),
    attributes: mapAttributes(event.attributes),
  };
}

// TODO - Fix this for camelCasing?
function mapLink(link: ILink) {
  return {
    traceId: stringOrUintToString(link.traceId),
    spanId: stringOrUintToString(link.spanId),
    traceState: link.traceState,
    attributes: mapAttributes(link.attributes),
    // FIXME
    flags: link.flags,
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
