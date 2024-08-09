import { context, propagation } from "@opentelemetry/api";

export function propagateFpxTraceId(request: Request) {
  // HACK - We need to extract the traceparent from the request headers
  //        but we also need to set a dummy traceparent in the case that
  //        we are receiving an explicit trace-id to use from FPX.
  //
  // Extract fpx trace ID from request headers (if it exists)
  // and set it as a dummy active context
  //
  // TODO - Validate the id here using an otel helper, and warn if it is invalid
  const traceId = request.headers.get("x-fpx-trace-id");

  let activeContext = context.active();
  if (traceId) {
    activeContext = propagation.extract(context.active(), {
      traceparent: createTraceparentHeader(traceId),
    });
  } else {
    activeContext = propagation.extract(context.active(), request.headers);
  }

  return activeContext;
}

/**
 * Creates a traceparent header with a random span id
 *
 * @param traceId - The trace id to use in the traceparent header
 * @returns A traceparent header
 */
function createTraceparentHeader(traceId: string): string {
  const version = "00"; // Version of the traceparent header

  // NOTE - A dummy span id like the following will be rejected by trace propagation API
  //        Look in the otel codebase for their regex - it filters out anything that's just 0 repeating
  //
  // const spanId = '0000000000000000'; // Dummy span ID
  //
  // HACK - Generate a random span id so we can spoof a proper trace parent
  //
  const spanId = generateSpanId();
  const traceFlags = "01"; // Trace flags (01 means sampled)

  return `${version}-${traceId}-${spanId}-${traceFlags}`;
}

/**
 * Generates a random 16-character hex string that is not all zeros
 *
 * @returns A random 16-character hex string
 */
function generateSpanId(): string {
  let spanId: string;
  do {
    spanId = [...Array(16)]
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join("");
  } while (/^[0]{16}$/.test(spanId));
  return spanId;
}
