export type ExtendedExecutionContext = ExecutionContext & {
  __waitUntilTimer?: ReturnType<typeof setInterval>;
  __waitUntilPromises?: Promise<void>[];
  waitUntilFinished?: () => Promise<void>;
};

export function polyfillWaitUntil(ctx: ExtendedExecutionContext) {
  console.log("adding waitUntilFinished");

  if (typeof ctx.waitUntil !== "function") {
    console.log("Polyfilling waitUntil");
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

export function enableWaitUntilTracing(context: ExecutionContext) {
  const promises: Promise<void>[] = [];
  const proxyContext = new Proxy(context, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (prop === "waitUntil" && typeof value === "function") {
        return function waitUntil(this: unknown, promise: Promise<unknown>) {
          const scope = this === receiver ? target : this;
          const result = value.apply(scope, [promise]);
          promises.push(result);
          return result;
        };
      }

      return value;
    },
  });

  return { proxyContext, promises };
}
