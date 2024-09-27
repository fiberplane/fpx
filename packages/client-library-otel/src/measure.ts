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
   * The return type of the function being measured. This could be a value including a promise or a(n) (async) generator
   */
  RESULT,
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
    result: ExtractInnerResult<RESULT>,
  ) => RESULT extends Promise<unknown> ? Promise<void> | void : void;

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
    result: ExtractInnerResult<RESULT>,
  ) => RESULT extends Promise<unknown>
    ? Promise<void> | void
    : RESULT extends AsyncGenerator<unknown, unknown, unknown>
      ? Promise<void> | void
      : void;

  /**
   * Optional logger module to use for logging on errors, etc.
   * Similar to passing `console`. Should be an object with methods `debug`, `info`, `warn`, `error`.
   */
  logger?: FpxLogger;
};

type ExtractInnerResult<TYPE> = TYPE extends Generator<
  infer T,
  infer TReturn,
  unknown
>
  ? T | TReturn
  : TYPE extends AsyncGenerator<infer T, infer TReturn, unknown>
    ? T | TReturn
    : TYPE extends Promise<infer R>
      ? R
      : TYPE;

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
export function measure<ARGS extends unknown[], RESULT>(
  options: MeasureOptions<ARGS, RESULT>,
  fn: (...args: ARGS) => RESULT,
): (...args: ARGS) => RESULT;

export function measure<ARGS extends unknown[], RESULT>(
  nameOrOptions: string | MeasureOptions<ARGS, RESULT>,
  fn: (...args: ARGS) => RESULT,
): (...args: ARGS) => RESULT {
  const isOptions = typeof nameOrOptions === "object";
  const name: string = isOptions ? nameOrOptions.name : nameOrOptions;
  const {
    onStart,
    onSuccess,
    onError,
    checkResult,
    logger,
    endSpanManually,
    attributes,
    spanKind,
  } = isOptions ? nameOrOptions : ({} as MeasureOptions<ARGS, RESULT>);

  return (...args: ARGS): RESULT => {
    function handleActiveSpan(span: Span): RESULT {
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
          const handlerOptions = {
            endSpanManually,
            onSuccess,
            checkResult,
            onError,
          };

          return handleGenerator(
            span,
            returnValue as Generator<
              ExtractInnerResult<RESULT>,
              ExtractInnerResult<RESULT>,
              unknown
            >,
            handlerOptions,
          ) as RESULT;
        }

        if (isAsyncGeneratorValue(returnValue)) {
          shouldEndSpan = false;
          const handlerOptions = {
            endSpanManually,
            onSuccess,
            checkResult,
            onError,
          };

          return handleAsyncGenerator(
            span,
            returnValue as AsyncGenerator<
              ExtractInnerResult<RESULT>,
              ExtractInnerResult<RESULT>,
              unknown
            >,
            handlerOptions,
          ) as RESULT;
        }

        if (isPromise<ExtractInnerResult<RESULT>>(returnValue)) {
          shouldEndSpan = false;
          return handlePromise(
            span,
            returnValue as Promise<ExtractInnerResult<RESULT>>,
            {
              onSuccess,
              onError,
              checkResult,
              endSpanManually,
            },
          ) as RESULT;
        }

        span.setStatus({ code: SpanStatusCode.OK });
        if (onSuccess) {
          try {
            const result = onSuccess(
              span,
              returnValue as ExtractInnerResult<RESULT>,
            );
            if (isPromise(result)) {
              shouldEndSpan = false;
              result.finally(() => {
                if (!endSpanManually) {
                  span.end();
                }
              });
            }
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
async function handlePromise<T extends Promise<unknown>>(
  span: Span,
  resultPromise: T,
  options: Pick<
    MeasureOptions<unknown[], T>,
    "onSuccess" | "onError" | "checkResult" | "endSpanManually"
  >,
) {
  const { onSuccess, onError, checkResult, endSpanManually = false } = options;
  try {
    const result = (await resultPromise) as ExtractInnerResult<T>;

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

        return result as ExtractInnerResult<T>;
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
function handleGenerator<T = unknown, TReturn = unknown, TNext = unknown>(
  span: Span,
  iterable: Generator<T, TReturn, TNext>,
  options: Pick<
    MeasureOptions<unknown[], Generator<T, TReturn, TNext>>,
    "onSuccess" | "onError" | "checkResult" | "endSpanManually"
  >,
): Generator<T, TReturn, TNext> {
  const { checkResult, endSpanManually, onError, onSuccess } = options;
  function handleError(error: unknown) {
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

    span.end();
  }

  const active = context.active();
  return {
    next: context.bind(
      active,
      measure("iterator.next", function nextFunction(...args: [] | [TNext]) {
        try {
          const result = iterable.next(...args);
          if (result.done) {
            try {
              if (checkResult) {
                checkResult(result.value);
              }

              if (!endSpanManually) {
                span.setStatus({ code: SpanStatusCode.OK });
                span.end();
              }

              if (onSuccess) {
                onSuccess(span, result.value);
              }
            } catch (error) {
              handleError(error);
            }
          }

          return result;
        } catch (error) {
          handleError(error);
          throw error;
        }
      }),
    ),
    return: context.bind(active, function returnFunction(value: TReturn) {
      try {
        const result = iterable.return(value);
        if (result.done) {
          try {
            if (checkResult) {
              checkResult(result.value);
            }

            if (!endSpanManually) {
              span.setStatus({ code: SpanStatusCode.OK });
              span.end();
            }

            if (onSuccess) {
              onSuccess(span, result.value);
            }
          } catch (error) {
            handleError(error);
          }
        }

        return result;
      } catch (error) {
        handleError(error);
        throw error;
      }
    }),
    throw: context.bind(active, function throwFunction(error: unknown) {
      try {
        return iterable.throw(error);
      } finally {
        handleError(error);
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
function handleAsyncGenerator<T = unknown, TReturn = unknown, TNext = unknown>(
  span: Span,
  iterable: AsyncGenerator<T, TReturn, TNext>,
  options: Pick<
    MeasureOptions<unknown[], AsyncGenerator<T, TReturn, TNext>>,
    "onSuccess" | "onError" | "checkResult" | "endSpanManually"
  >,
): AsyncGenerator<T, TReturn, TNext> {
  const { checkResult, endSpanManually, onError, onSuccess } = options;

  const active = context.active();
  function handleError(error: unknown) {
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

    span.end();
  }

  return {
    next: context.bind(
      active,
      measure(
        "iterator.next",
        async function nextFunction(...args: [] | [TNext]) {
          try {
            const result = await iterable.next(...args);
            if (result.done) {
              try {
                if (checkResult) {
                  await checkResult(result.value);
                }

                if (!endSpanManually) {
                  span.setStatus({ code: SpanStatusCode.OK });
                  span.end();
                }

                if (onSuccess) {
                  await onSuccess(span, result.value);
                }
              } catch (error) {
                handleError(error);
              }
            }

            return result;
          } catch (error) {
            handleError(error);
            throw error;
          }
        },
      ),
    ),
    return: context.bind(active, async function returnFunction(value: TReturn) {
      try {
        const result = await iterable.return(value);
        if (result.done) {
          try {
            if (checkResult) {
              checkResult(result.value);
            }

            if (!endSpanManually) {
              span.setStatus({ code: SpanStatusCode.OK });
              span.end();
            }

            if (onSuccess) {
              onSuccess(span, result.value);
            }
          } catch (error) {
            handleError(error);
          }
        }

        return result;
      } catch (error) {
        handleError(error);
        throw error;
      }
    }),
    throw: context.bind(active, async function throwFunction(error: unknown) {
      try {
        return await iterable.throw(error);
      } finally {
        handleError(error);
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
}

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
}
