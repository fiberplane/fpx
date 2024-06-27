import { SpanStatusCode, trace } from "@opentelemetry/api";

export type ExtendedExecutionContext = ExecutionContext & {
  __waitUntilTimer?: ReturnType<typeof setInterval>;
  __waitUntilPromises?: Promise<void>[];
  waitUntilFinished?: () => Promise<void>;
};

export function polyfillWaitUntil(ctx: ExtendedExecutionContext) {
  console.log("should polyfill?", typeof ctx.waitUntil);
  if (typeof ctx.waitUntil !== "function") {
    if (!Array.isArray(ctx.__waitUntilPromises)) {
      ctx.__waitUntilPromises = [];
    }

    ctx.waitUntil = function waitUntil(promise: Promise<void>) {
      // biome-ignore lint/style/noNonNullAssertion: https://github.com/highlight/highlight/pull/6480
      ctx.__waitUntilPromises!.push(promise);
      ctx.__waitUntilTimer = setInterval(() => {
        Promise.allSettled(ctx.__waitUntilPromises || []).then(() => {
          if (ctx.__waitUntilTimer) {
            clearInterval(ctx.__waitUntilTimer);
            ctx.__waitUntilTimer = undefined;
          }
        });
      }, 200);
    };
  }

  ctx.waitUntilFinished = async function waitUntilFinished() {
    if (ctx.__waitUntilPromises) {
      await Promise.allSettled(ctx.__waitUntilPromises);
    }
  };
}

type WaitUntilFn = ExecutionContext["waitUntil"];

export function enableWaitUntilTracing(context: ExecutionContext) {
  const proxyContext = new Proxy(context, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (prop === "waitUntil" && typeof value === "function") {
        console.log("returning modified function", value);

        return function waitUntil(promise: Promise<any>) {
          console.log("this function is called");
          const activeSpan = trace.getActiveSpan();
          if (!activeSpan) {
            console.log("no active span", value, promise);
            return value.apply(this === receiver ? target : this, [promise]);
          }

          console.log("active span", !!activeSpan);
          // activeSpan.add
          const tracer = trace.getTracer("otel-example-tracer-node");
          const span = tracer.startSpan("waitUntil");
          value.apply(this === receiver ? target : this, [promise]);

          promise
            .then((result) => {
              console.log("result ok");
              span.setStatus({ code: SpanStatusCode.OK });
              return result;
            })
            .catch((error) => {
              span.setStatus({ code: SpanStatusCode.ERROR });

              if (error instanceof Error) {
                span.recordException(error);
              }

              throw error;
            })
            .finally(() => {
              console.log("span done");
              span.end();
            });
        };
      }
      return value;
    },
  });

  return proxyContext;
}

// function wrapper(fn: WaitUntilFn, context: ExecutionContext) {
// return function (...args: Parameters<WaitUntilFn>) {
//   return fn.apply(context, args);
// };
// }

// function wrap<T extends (...args: any[]) => any>(fn: T, handler: ProxyHandler<T>): T {
//   return new Proxy(fn, handler)
// }
