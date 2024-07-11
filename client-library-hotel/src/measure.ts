import { type Span, SpanStatusCode, trace } from "@opentelemetry/api";

/**
 * Wraps a function in a span, measuring the time it takes to execute
 * the function.
 *
 * @param name (string) The name of the span that will be created
 * @param fn (function) The function to be measured
 * @returns (function) The wrapped function, with the same signature as the original function
 */
export function measure<T, A extends unknown[]>(
  name: string,
  fn: (...args: A) => T,
): (...args: A) => T {
  return (...args: A): T => {
    const tracer = trace.getTracer("fpx-tracer");

    function handleActiveSpan(span: Span): T {
      let shouldEndSpan = true;
      try {
        const returnValue = fn(...args);
        if (returnValue instanceof Promise) {
          shouldEndSpan = false;
          return returnValue
            .then((result) => {
              span.setStatus({ code: SpanStatusCode.OK });
              return result;
            })
            .catch((error) => {
              // recordException only accepts Error objects or strings
              const sendError =
                error instanceof Error || typeof error === "string"
                  ? error
                  : "Unknown error occurred";
              span.recordException(sendError);

              // Rethrow the error
              throw error;
            })
            .finally(() => span.end()) as T;
        }

        span.setStatus({ code: SpanStatusCode.OK });
        return returnValue;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      } finally {
        if (shouldEndSpan) {
          span.end();
        }
      }
    }

    return tracer.startActiveSpan(name, handleActiveSpan);
  };
}
