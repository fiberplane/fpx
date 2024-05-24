# Mizu Client

This is a client library that will send telemetry data to the Mizu server (in `../api`).

Note that it monkey-patches `console.*` functions to send logs to the Mizu server.

So, any time you use a `console.log`, `console.error`, etc., in your app, we will send that data to Mizu!

This readme takes you through:

- Creating a Hono Project
- Adding the mizu "client library"
- Configuring your project to use mizu

## Create a Hono project

Create a new Hono project with the following command. When prompted, choose `cloudflare-workers` as the template.

```sh
npm create hono@latest my-hono-project
```

## Install the mizu client

### Copy the `mizu.ts` file
To "install" the mizu client, **add the [`mizu.ts`](./mizu.ts) file from this repo** to the `src/` folder of your Hono project.

For example,

```sh
# From my-hono-project
cp ../mizu/client-library/mizu.ts src/
```

### Add middleware

Add the mizu import, and then add middleware definitions **AT THE TOP OF YOUR APP**, ideally in your `src/index.ts`

If you only just started your project, you can copy paste the entire contents below into your `src/index.ts`:

```ts
import { Hono } from 'hono'
import { Mizu, logger } from "./mizu";

type Bindings = {
  MIZU_ENDPOINT: string;
};

const app = new Hono<{ Bindings: Bindings }>();

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

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app;
```

## Add `MIZU_ENDPOINT` environment variable

Add `MIZU_ENDPOINT=http://localhost:8788/v0/logs` to your `.dev.vars` file!

```sh
echo -e '\nMIZU_ENDPOINT=http://localhost:8788/v0/logs\n' >> .dev.vars
```

You should be good to go! Just execute `npm run dev` to kick off your new Hono project..

Make requests to your Hono app, and the logs should show up in the Mizu UI at `http://localhost:5173`!