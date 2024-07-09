import { Span, SpanStatusCode, trace } from "@opentelemetry/api";

export async function withSpan(name: string, fn: () => any) {
  return await spanPromise(name, Promise.resolve().then(fn));
}

export async function spanPromise<T>(name: string, promise: Promise<T>) {
  const handleRouteSpan = (span: Span) => {
    return Promise.resolve(promise)
      .then((result) => {
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      })
      .catch((error) => {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      })
      .finally(() => {
        span.end();
      });
  };

  const tracer = trace.getTracer("otel-example-tracer-node");
  return await tracer.startActiveSpan(name, handleRouteSpan);

}
