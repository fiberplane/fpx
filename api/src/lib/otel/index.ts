import { randomBytes } from "node:crypto";
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
import { transformStack } from "../transform-stack.js";

export const OTEL_TRACE_ID_REGEX = /^[0-9a-f]{32}$/i;

/**
 * Check if a trace ID is a valid otel trace id
 */
export function isValidOtelTraceId(traceId: string): boolean {
  return OTEL_TRACE_ID_REGEX.test(traceId);
}

/**
 * Generate a trace ID that is compatible with the OpenTelemetry standard
 * Otel trace ids are 16 bytes long, and can be represented as a hex string
 */
export function generateOtelTraceId(): string {
  return randomBytes(16).toString("hex");
}

/**
 * NOT IN USE - TEST ME
 *
 * A version of generateOtelTraceId that is compatible with the web standards
 */
export function generateOtelTraceIdWebStandard(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type MizuSpan = {
  trace_id: string;
  span_id: string;
  parent_span_id: string | null;
  name: string;
  trace_state: string | null | undefined;
  kind: string;
  scope_name: string | null;
  scope_version: string | null | undefined;
  start_time: string;
  end_time: string;
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
export async function fromCollectorRequest(
  tracesData: IExportTraceServiceRequest,
): Promise<Array<MizuSpan>> {
  const result: Array<MizuSpan> = [];

  for (const resourceSpan of tracesData.resourceSpans ?? []) {
    const resourceAttributes = resourceSpan.resource
      ? await mapAttributes(resourceSpan.resource.attributes)
      : null;

    for (const scopeSpan of resourceSpan.scopeSpans ?? []) {
      let scopeName: string | null = null;
      let scopeVersion: string | null = null;

      if (scopeSpan.scope) {
        scopeName = scopeSpan.scope.name ?? null;
        scopeVersion = scopeSpan.scope.version ?? null;
      }

      const scopeAttributes = scopeSpan.scope
        ? await mapAttributes(scopeSpan.scope.attributes ?? [])
        : null;

      for (const span of scopeSpan.spans ?? []) {
        const kind = convertToSpanKind(span.kind);

        const attributes = await mapAttributes(span.attributes);

        const startTime = new Date(Number(span.startTimeUnixNano) / 1e6);
        const endTime = new Date(Number(span.endTimeUnixNano) / 1e6);

        const parentSpanId = span.parentSpanId
          ? stringOrUintToString(span.parentSpanId)
          : null;

        const events = await Promise.all(
          span.events.map((event) => mapEvent(event)),
        );
        const links = await Promise.all(
          span.links.map((link) => mapLink(link)),
        );

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
          // TODO: Verify date formats
          start_time: startTime.toString(),
          // TODO: Verify date formats
          end_time: endTime.toString(),
          attributes,
          scope_attributes: scopeAttributes,
          resource_attributes: resourceAttributes,
          status: span.status ? mapStatus(span.status) : undefined,
          events,
          links,
        } satisfies MizuSpan;

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

async function mapAttributeValue(value: IAnyValue): Promise<AttributeValue> {
  if (!value) {
    return null;
  }
  if (value.stringValue !== undefined) {
    return value.stringValue;
  }
  if (value.boolValue !== undefined) {
    return value.boolValue;
  }
  if (value.intValue !== undefined) {
    return value.intValue;
  }
  if (value.doubleValue !== undefined) {
    return value.doubleValue;
  }
  if (value.bytesValue !== undefined) {
    return value.bytesValue;
  }
  if (value.arrayValue !== undefined) {
    // @ts-expect-error - By convention we don't actually nest values so don't need a recursive type
    return Promise.all(value.arrayValue.values.map(mapAttributeValue));
  }
  if (value.kvlistValue !== undefined) {
    // @ts-expect-error - By convention we don't actually nest values so don't need a recursive type
    return mapAttributes(value.kvlistValue.values);
  }
  return null;
}

async function mapAttributes(
  attributes: IKeyValue[],
): Promise<Record<string, AttributeValue>> {
  const result: Record<string, AttributeValue> = {};
  for (const kv of attributes) {
    if (kv.key === "exception.stacktrace") {
      // HACK - convert stack trace if possible
      const value = kv.value ? await mapAttributeValue(kv.value) : null;
      if (typeof value === "string") {
        result[kv.key] = await transformStack(value);
      } else {
        result[kv.key] = value;
      }
    } else {
      result[kv.key] = kv.value ? await mapAttributeValue(kv.value) : null;
    }
  }

  return result;
}

async function mapEvent(event: IEvent) {
  return {
    name: event.name,
    timestamp: new Date(Number(event.timeUnixNano) / 1e6),
    attributes: await mapAttributes(event.attributes),
  };
}

async function mapLink(link: ILink) {
  return {
    trace_id: stringOrUintToString(link.traceId),
    span_id: stringOrUintToString(link.spanId),
    trace_state: link.traceState,
    attributes: await mapAttributes(link.attributes),
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
