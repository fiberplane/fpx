import {
  type Attributes,
  type Exception,
  type Span,
  type SpanKind,
  SpanStatusCode,
  context,
  trace,
} from "@opentelemetry/api";
import type { FpxLogger } from "./logger";
import { isPromise } from "./utils";

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
   * This is an advanced feature in cases where you don't want the open telemetry spans
   * to be ended automatically.
   *
   * Some disclaimers: this can only be used in combination with promises and with an onSuccess
   *  handler. This handler should call span.end() at some point. If you want the on success
   * handler to trigger another async function you may want to use waitUntil to prevent the
   * worker from terminating before the traces/spans are finished & send to the server
   *
   * How this is currently used;:
   * We're using it to show the duration of a request in case it's being streamed back to
   * the client. In those cases the response is returned early while work is still being done.
   *
   */
  endSpanManually?: boolean;

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

  /**
   * Optional logger module to use for logging on errors, etc.
   * Similar to passing `console`. Should be an object with methods `debug`, `info`, `warn`, `error`.
   */
  logger?: FpxLogger;
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
export function measure<A extends unknown[], R>(
  options: MeasureOptions<A, R, R>,
  fn: (...args: A) => R,
): (...args: A) => R;

export function measure<A extends unknown[], R>(
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
  const logger = isOptions ? nameOrOptions.logger : undefined;
  const endSpanManually =
    (isOptions ? nameOrOptions.endSpanManually : undefined) || false;

  return (...args: A): R => {
    function handleActiveSpan(span: Span): R {
      let shouldEndSpan = true;

      if (onStart) {
        try {
          onStart(span, args);
        } catch (error) {
          if (logger) {
            const errorMessage = formatException(convertToException(error));

            logger.warn(
              `Error in onStart while measuring ${name}:`,
              errorMessage,
            );
          }
        }
      }

      try {
        const returnValue = fn(...args);

        if (isGeneratorValue(returnValue)) {
          shouldEndSpan = false;
          return handleSyncIterator(span, returnValue) as R;
        }
        if (isPromise<R>(returnValue)) {
          shouldEndSpan = false;
          return returnValue.then((value) => {
            if (isAsyncGeneratorValue(value)) {
              shouldEndSpan = false;
              return handleAsyncIterator(span, value) as R;
            }

            return handlePromise<R>(span, returnValue, {
              onSuccess,
              onError,
              checkResult,
              endSpanManually,
            });
          }) as R;
        }

        span.setStatus({ code: SpanStatusCode.OK });

        if (onSuccess) {
          try {
            onSuccess(span, returnValue);
          } catch (error) {
            if (logger) {
              const errorMessage = formatException(convertToException(error));
              logger.warn(
                `Error in onSuccess while measuring ${name}:`,
                errorMessage,
              );
            }
          }
        }

        return returnValue;
      } catch (error) {
        const exception: Exception = convertToException(error);
        span.recordException(exception);

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
    "onSuccess" | "onError" | "checkResult" | "endSpanManually"
  >,
): Promise<T> {
  const { onSuccess, onError, checkResult, endSpanManually = false } = options;
  try {
    const result = await Promise.resolve(promise);

    if (checkResult) {
      try {
        await checkResult(result);
      } catch (error) {
        // recordException only accepts Error objects or strings
        const exception = convertToException(error);
        span.recordException(exception);

        if (onError) {
          try {
            await onError(span, exception);
          } catch {
            // swallow error
          }
        }

        if (onSuccess) {
          try {
            await onSuccess(span, result);
          } catch {
            // swallow error
          } finally {
            if (!endSpanManually) {
              span.end();
            }
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
      const exception = convertToException(error);
      span.recordException(exception);
      const message = formatException(exception);
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
    if (!endSpanManually || !onSuccess) {
      span.end();
    }
  }
}

/**
 * Handles synchronous iterators (generators).
 * Measures the time until the generator is fully consumed.
 */
function handleSyncIterator<T = unknown, TReturn = unknown, TNext = unknown>(
  span: Span,
  iterable: Generator<T, TReturn, TNext>,
): Generator<T, TReturn, TNext> {
  const active = context.active();
  return {
    next: context.bind(
      active,
      measure("iterator.next", function nextFunction(...args: [] | [TNext]) {
        try {
          const result = iterable.next(...args);
          if (result.done) {
            span.setStatus({ code: SpanStatusCode.OK });
            span.end();
          }

          return result;
        } catch (error) {
          const exception = convertToException(error);
          span.recordException(exception);
          const message = formatException(exception);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message,
          });
          span.end();
          throw error;
        }
      }),
    ),
    return: context.bind(active, function returnFunction(value: TReturn) {
      try {
        const result = iterable.return(value);
        span.setStatus({
          code: SpanStatusCode.OK,
        });
        return result;
      } catch (error) {
        const exception = convertToException(error);
        span.recordException(exception);
        const message = formatException(exception);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message,
        });
        throw error;
      } finally {
        span.end();
      }
    }),
    throw: context.bind(active, function throwFunction(error: unknown) {
      try {
        if (iterable.throw) {
          return iterable.throw(error);
        }
        throw error;
      } finally {
        const exception = convertToException(error);
        span.recordException(exception);
        const message = formatException(exception);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message,
        });
        span.end();
      }
    }),
    [Symbol.iterator]() {
      return this;
    },
  };
}

/**
 * Handles asynchronous iterators (async generators).
 * Measures the time until the async generator is fully consumed.
 */
function handleAsyncIterator<T = unknown, TReturn = unknown, TNext = unknown>(
  span: Span,
  iterable: AsyncGenerator<T, TReturn, TNext>,
): AsyncGenerator<T, TReturn, TNext> {
  const active = context.active();
  return {
    next: context.bind(
      active,
      measure(
        "iterator.next",
        async function nextFunction(...args: [] | [TNext]) {
          try {
            const result = await iterable.next(...args);
            if (result.done) {
              span.setStatus({ code: SpanStatusCode.OK });
              span.end();
            }

            return result;
          } catch (error) {
            const exception = convertToException(error);
            span.recordException(exception);
            const message = formatException(exception);
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message,
            });
            span.end();
            throw error;
          }
        },
      ),
    ),
    return: context.bind(active, async function returnFunction(value: TReturn) {
      try {
        const result = await iterable.return(value);
        span.setStatus({
          code: SpanStatusCode.OK,
        });
        return result;
      } catch (error) {
        const exception = convertToException(error);
        span.recordException(exception);
        const message = formatException(exception);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message,
        });
        throw error;
      } finally {
        span.end();
      }
    }),
    throw: context.bind(active, async function throwFunction(error: unknown) {
      try {
        return await iterable.throw(error);
      } finally {
        const exception = convertToException(error);
        span.recordException(exception);
        const message = formatException(exception);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message,
        });
        span.end();
      }
    }),
    [Symbol.asyncIterator]() {
      return this;
    },
  };
}

function convertToException(error: unknown) {
  return error instanceof Error ? error : "Unknown error occurred";
}

function formatException(exception: Exception) {
  return typeof exception === "string"
    ? exception
    : exception.message || "Unknown error occurred";
}

// const GeneratorFunction = Object.getPrototypeOf(function* () {}).constructor;
export function isGeneratorValue<
  T = unknown,
  TReturn = unknown,
  TNext = unknown,
>(value: unknown): value is Generator<T, TReturn, TNext> {
  return (
    value !== null && typeof value === "object" && Symbol.iterator in value
  );
  // return Object.getPrototypeOf(fn).constructor.name === "GeneratorFunction";
}

// const AsyncGeneratorFunction = Object.getPrototypeOf(
//   async function* () {},
// ).constructor;

/**
 * Type guard to check if a function is an async generator.
 *
 * @param fn - The function to be checked
 * @returns true if the function is an async generator, otherwise false
 */
export function isAsyncGeneratorValue<
  T = unknown,
  TReturn = unknown,
  TNext = unknown,
>(value: unknown): value is AsyncGenerator<T, TReturn, TNext> {
  return (
    value !== null && typeof value === "object" && Symbol.asyncIterator in value
  );
  // return fn instanceof AsyncGeneratorFunction;
}
