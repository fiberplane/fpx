import { type Span, SpanStatusCode, trace } from "@opentelemetry/api";

export async function withSpan<T>(name: string, fn: () => Promise<T>) {
  return await spanPromise(name, fn);
}

export async function spanPromise<T>(name: string, fn: () => Promise<T>) {
  const handleRouteSpan = (span: Span) => {
    console.log("Handle route span");
    return Promise.resolve()
      .then(fn)
      .then((result) => {
        console.log("-> active?", !!trace.getActiveSpan());

        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      })
      .catch((error) => {
        console.log("-> error");
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      })
      .finally(() => {
        console.log("span.end()");
        span.end();
      });
  };

  const tracer = trace.getTracer("otel-example-tracer-node");
  // trace.setSpanContext
  // const span = tracer.startSpan(name);
  // trace.setSpan(context.with(), span);
  return await tracer.startActiveSpan(name, handleRouteSpan);
  // return await tracer.startActiveSpan(name, handleRouteSpan);
}
