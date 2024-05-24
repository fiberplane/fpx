# Mizu Client

This is a client library that will send telemetry data to the Mizu server (in `../api`).

Note that it monkey-patches `console.*` functions to send logs to the Mizu server.

So, any time you use a `console.log`, `console.error`, etc., in your app, we will send that data to Mizu!

To "install" it, add [`mizu.ts`](./mizu.ts) to the `src/` folder of your Hono project, and then add the following as middleware **AT THE TOP OF YOUR APP**, ideally in your `src/index.ts`

```ts
import { Mizu, logger } from "./mizu";

/* ... other setup code ... */

// Mizu Tracing Middleware - Must be called first!
app.use(async (c, next) => {
  const config = { MIZU_ENDPOINT: c.env.MIZU_ENDPOINT };
  const ctx = c.executionCtx;

  const teardown = Mizu.init(
    config,
    ctx,
  );

  await next();

  teardown();
});

// Mizu request logging
app.use(logger());
```
