import { type Span, SpanStatusCode, trace } from "@opentelemetry/api";

export async function withSpan<T>(name: string, fn: () => Promise<T>) {
  return await spanPromise(name, fn);
}

export async function spanPromise<T>(name: string, fn: () => Promise<T>) {
  const handleRouteSpan = (span: Span) => {
    return Promise.resolve()
      .then(fn)
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

// I want to create a function called measure that is similar to spanPromise but instead of requiring a function that always returns a promise (and accepts no arguments), i want one that supports arguments.
// The function signature should be as follows:
export function measure<T, A extends unknown[]>(
  name: string,
  fn: (...args: A) => Promise<T>,
): (...args: A) => Promise<T> {
  return async (...args: A) => {
    const tracer = trace.getTracer("otel-example-tracer-node");
    const handleRouteSpan = (span: Span) => {
      return Promise.resolve()
        .then(() => fn(...args))
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

    const result = await tracer.startActiveSpan(name, handleRouteSpan);
    return result;
  };
}
// ...
