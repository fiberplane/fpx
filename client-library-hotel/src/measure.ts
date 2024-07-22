import {
  Attributes,
  type Span,
  SpanKind,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api";

export type MeasureOptions = {
  name: string;
  spanKind?: SpanKind;
  attributes?: Attributes;
};

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
): (...args: A) => T;

/**
 * Wraps a function in a span, measuring the time it takes to execute
 * the function.
 *
 * @param options param name and spanKind
 * @param fn
 */
export function measure<T, A extends unknown[]>(
  options: MeasureOptions,
  fn: (...args: A) => T,
): (...args: A) => T;

export function measure<T, A extends unknown[]>(
  nameOrOptions: string | MeasureOptions,
  fn: (...args: A) => T,
): (...args: A) => T {
  const name: string =
    typeof nameOrOptions === "string" ? nameOrOptions : nameOrOptions.name;
  const spanKind: SpanKind | undefined =
    typeof nameOrOptions === "object" ? nameOrOptions.spanKind : undefined;
  const attributes: Attributes | undefined =
    typeof nameOrOptions === "object" ? nameOrOptions.attributes : undefined;

  return (...args: A): T => {
    function handleActiveSpan(span: Span): T {
      let shouldEndSpan = true;
      try {
        const returnValue = fn(...args);
        if (returnValue instanceof Promise) {
          shouldEndSpan = false;
          return handlePromise(span, returnValue) as T;
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

    const tracer = trace.getTracer("fpx-tracer");
    return tracer.startActiveSpan(
      name,
      { kind: spanKind, attributes },
      handleActiveSpan,
    );
  };
}

/**
 * Handle complete flow of a promise (including ending the span)
 *
 * @returns the promise
 */
function handlePromise<V, T extends Promise<V>>(
  span: Span,
  promise: T,
): Promise<V> {
  return promise
    .then((result: V) => {
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
    .finally(() => span.end());
}
