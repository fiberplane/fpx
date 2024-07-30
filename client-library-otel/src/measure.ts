import {
  type Attributes,
  type Exception,
  type Span,
  type SpanKind,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api";

export type MeasureOptions<
  /**
   * Arguments for the function being measured
   */
  ARGS,
  /**
   * The return type of the function being measured
   * (awaited result if the return value is a promise)
   */
  RESULT,
  /**
   * The raw return type of the function being measured
   * (it is used to determine if the onSuccess function can be async)
   */
  RAW_RESULT,
> = {
  name: string;
  /**
   * The kind of the span
   */
  spanKind?: SpanKind;
  /**
   * Attributes to be added to the span
   */
  attributes?: Attributes;

  onStart?: (span: Span, args: ARGS) => void;
  /**
   * Allows you to specify a function that will be called when the span ends
   * and will be passed the span & result of the function being measured.
   *
   * This way you can do things like add additional attributes to the span
   */
  onSuccess?: (
    span: Span,
    result: RESULT,
  ) => RAW_RESULT extends Promise<unknown> ? Promise<void> | void : void;

  /**
   * Allows you to specify a function that will be called when the span ends
   * with an error and will be passed the (current) span & error that occurred.
   *
   * This way you can do things like add additional attributes to the span
   */
  onError?: (span: Span, error: unknown) => void;

  /**
   * You can specify a function that will allow you to throw an error based on the value of the
   * result (returned by the measured function). This error will only be used for recording the error
   * in the span and will not be thrown.
   */
  checkResult?: (
    result: RESULT,
  ) => RAW_RESULT extends Promise<unknown> ? Promise<void> | void : void;
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
  options: MeasureOptions<A, R, R>,
  fn: (...args: A) => R,
): (...args: A) => R;

export function measure<R, A extends unknown[]>(
  nameOrOptions: string | MeasureOptions<A, R, R>,
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
  const onSuccess = isOptions ? nameOrOptions.onSuccess : undefined;
  const onError = isOptions ? nameOrOptions.onError : undefined;
  const checkResult = isOptions ? nameOrOptions.checkResult : undefined;

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
        if (isPromise<R>(returnValue)) {
          shouldEndSpan = false;
          return handlePromise<R>(span, returnValue, {
            onSuccess,
            onError,
            checkResult,
          }) as R;
        }

        span.setStatus({ code: SpanStatusCode.OK });
        if (onSuccess) {
          try {
            onSuccess(span, returnValue);
          } catch {
            // swallow error
          }
        }
        return returnValue;
      } catch (error) {
        const sendError: Exception =
          error instanceof Error ? error : "Unknown error occurred";
        span.recordException(sendError);

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
async function handlePromise<T>(
  span: Span,
  promise: Promise<T>,
  options: Pick<
    MeasureOptions<unknown[], T, Promise<T>>,
    "onSuccess" | "onError" | "checkResult"
  >,
): Promise<T> {
  const { onSuccess, onError, checkResult } = options;
  try {
    const result = await Promise.resolve(promise);

    if (checkResult) {
      try {
        await checkResult(result);
      } catch (error) {
        // recordException only accepts Error objects or strings
        const sendError: Exception =
          error instanceof Error ? error : "Unknown error occured";
        span.recordException(sendError);

        if (onError) {
          try {
            await onError(span, sendError);
          } catch {
            // swallow error
          }
        }

        if (onSuccess) {
          try {
            await onSuccess(span, result);
          } catch {
            // swallow error
          }
        }

        return result;
      }
    }

    span.setStatus({ code: SpanStatusCode.OK });
    if (onSuccess) {
      try {
        await onSuccess(span, result);
      } catch {
        // swallow error
      }
    }

    return result;
  } catch (error) {
    try {
      // recordException only accepts Error objects or strings
      const sendError: Exception =
        error instanceof Error ? error : "Unknown error occured";
      span.recordException(sendError);

      const message = typeof sendError === "string" ? sendError : (sendError.message || "Unknown error occured");
      span.setStatus({ 
        code: SpanStatusCode.ERROR,
        message,
      });

      if (onError) {
        try {
          onError(span, error);
        } catch {
          // swallow error
        }
      }
    } catch {
      // swallow error
    }

    // Rethrow the error
    throw error;
  } finally {
    span.end();
  }
}

function isPromise<T>(value: unknown): value is Promise<T> {
  return value instanceof Promise;
}
