import { type ExecutionContext, Hono } from "hono";
// import { Mizu, logger } from "mizu";
import { createHonoMiddleware } from "../src/index";
import { enableWaitUntilTracing } from "../src/waitUntil";

const rawApp = new Hono();

const app = new Proxy(rawApp, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver);
    if (prop === "fetch" && typeof value === "function") {
      return function fetch(...args: Parameters<(typeof rawApp)["fetch"]>) {
        const [request, env, executionCtx] = args;
        // const [middleware] = args;
        // let patchedContext =
        // console.log('oh.. its me')
        const proxyExecutionCtx = executionCtx
          ? enableWaitUntilTracing(executionCtx)
          : undefined;
        return value(request, env, proxyExecutionCtx);
      };
    }
    return Reflect.get(target, prop, receiver);
  },
});

// function injectWaitUntil(executionCtx: ExecutionContext) {
//   return new Proxy(executionCtx, {
//     get(target, prop, receiver) {
//       const value = Reflect.get(target, prop, receiver);
//       if (prop === "waitUntil" && typeof value === "function") {
//         return function waitUntil(promise: Promise<void>) {
//           console.log('wait until called')
//           return value(promise);
//         };
//       }
//       return value;
//     },
//   });
// }
// }

// )
app.use(createHonoMiddleware());

const sleep = (ms: number) =>
  new Promise<void>((resolve) =>
    setTimeout(() => {
      console.log("done");
      resolve();
    }, ms),
  );

app.get("/", async (c) => {
  c.executionCtx.waitUntil(sleep(10));
  return c.text("Hello Hono!");
});

export default app;
