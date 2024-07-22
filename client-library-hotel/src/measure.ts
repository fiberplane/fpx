import {
  Attributes,
  type Span,
  SpanKind,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api";

export type MeasureOptions<A, R> = {
  name: string;
  /**
   * The kind of the span
   */
  spanKind?: SpanKind;
  /**
   * Attributes to be added to the span
   */
  attributes?: Attributes;

  onStart?: (span: Span, args: A) => void;
  /**
   * Allows you to specify a function that will be called when the span ends
   * and will be passed the span & result of the function being measured.
   *
   * This way you can do things like add additional attributes to the span
   */
  onEnd?: (
    span: Span,
    result: R extends Promise<Awaited<R>> ? Awaited<R> : R,
  ) => R extends Promise<Awaited<R>> ? Promise<void> : void;

  /**
   * Allows you to specify a function that will be called when the span ends
   * with an error and will be passed the (current) span & error that occurred.
   *
   * This way you can do things like add additional attributes to the span
   */
  onError?: (span: Span, error: unknown) => void;
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
export function measure<R, A extends unknown[]>(
  options: MeasureOptions<A, R>,
  fn: (...args: A) => R,
): (...args: A) => R;

export function measure<R, A extends unknown[]>(
  nameOrOptions: string | MeasureOptions<A, R>,
  fn: (...args: A) => R,
): (...args: A) => R {
  const isOptions = typeof nameOrOptions === "object";
  const name: string = isOptions ? nameOrOptions.name : nameOrOptions;
  const spanKind: SpanKind | undefined = isOptions
    ? nameOrOptions.spanKind
    : undefined;
  const attributes: Attributes | undefined = isOptions
    ? nameOrOptions.attributes
    : undefined;
  const onStart = isOptions ? nameOrOptions.onStart : undefined;
  const onEnd = isOptions ? nameOrOptions.onEnd : undefined;
  const onError = isOptions ? nameOrOptions.onError : undefined;

  return (...args: A): R => {
    function handleActiveSpan(span: Span): R {
      let shouldEndSpan = true;
      if (onStart) {
        try {
          onStart(span, args);
        } catch {
          // swallow error
        }
      }
      try {
        const returnValue = fn(...args);
        if (returnValue instanceof Promise) {
          shouldEndSpan = false;
          return handlePromise(span, returnValue, {
            onEnd,
            onError,
          }) as R;
        }

        span.setStatus({ code: SpanStatusCode.OK });
        if (onEnd) {
          try {
            onEnd(span, returnValue);
          } catch {
            // swallow error
          }
        }
        return returnValue;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : "Unknown error",
        });

        if (onError) {
          try {
            onError(span, error);
          } catch {
            // swallow error
          }
        }

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
  options: Pick<MeasureOptions<unknown[], V>, "onEnd" | "onError">,
): Promise<V> {
  const { onEnd, onError } = options;
  return promise
    .then(async (result: V) => {
      span.setStatus({ code: SpanStatusCode.OK });
      if (onEnd) {
        try {
          await onEnd(span, result);
        } catch {
          // swallow error
        }
      }
      return result;
    })
    .catch((error) => {
      // recordException only accepts Error objects or strings
      const sendError =
        error instanceof Error || typeof error === "string"
          ? error
          : "Unknown error occurred";
      span.recordException(sendError);

      if (onError) {
        try {
          onError(span, error);
        } catch {
          // swallow error
        }
      }

      // Rethrow the error
      throw error;
    })
    .finally(() => span.end());
}
