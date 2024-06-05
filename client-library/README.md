# Mizu Client

This is a client library that will send telemetry data to the *local* Mizu server.

Note that it monkey-patches `console.*` functions to send logs to the Mizu server, 
so any time you use a `console.log`, `console.error`, etc., in your app, we will send that data to Mizu!

## Quick Start

Create hono project
```sh
# Create a hono project, using cloudflare-workers runtime
npm create hono@latest my-hono-project
# > cloudflare-workers
```

Install middleware

```sh
npm i @mizu-dev/hono
```

Add middleware

```ts
import { Hono } from "hono";
import { createHonoMiddleware } from "@mizu-dev/hono";

const app = new Hono();

app.use(createHonoMiddleware())

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

export default app;
```

Launch UI

```sh
npx @mizu-dev/studio
```

Visit `http://localhost:8788` to see your logs come in as you test your app!

## Long Start

This readme takes you through:

- Creating a Hono Project
- Installing the mizu client library
- Configuring your project to use mizu
- Launching the mizu UI

## Create a Hono project

Create a new Hono project with the following command. When prompted, choose `cloudflare-workers` as the template.

```sh
npm create hono@latest my-hono-project
# > cloudflare-workers
```

## Install the mizu client

```sh
npm i @mizu-dev/hono
```

### Add middleware

Add the mizu import, and then add middleware definitions **AT THE TOP OF YOUR APP**, ideally in your `src/index.ts`

If you only just started your project, you can copy paste the entire contents below into your `src/index.ts`:

```ts
import { type Context, Hono } from "hono";
import { createHonoMiddleware } from "@mizu-dev/hono";

const app = new Hono();

const createConfig = (c: Context) => {
 return {
  endpoint: c.env?.MIZU_ENDPOINT,
  service: c.env?.SERVICE_NAME || "unknown",
  libraryDebugMode: c.env?.LIBRARY_DEBUG_MODE,
  monitor: {
   fetch: true,
   logging: true,
   requests: true,
  },
 };
}

app.use(createHonoMiddleware({ createConfig }))
app.get("/", (c) => {
	return c.text("Hello Hono!");
});

export default app;
```

## Add `MIZU_ENDPOINT` environment variable

Add `MIZU_ENDPOINT=http://localhost:8788/v0/logs` to your `.dev.vars` file!

```sh
echo -e '\nMIZU_ENDPOINT=http://localhost:8788/v0/logs\n' >> .dev.vars
```

You should be good to go! Just execute `npm run dev` to kick off your new Hono project..

Make requests to your Hono app, and the logs should show up in the Mizu UI!

## Launch the Mizu UI

```sh
npx @mizu-dev/studio
```

That's it! You should see your logs in the Mizu UI.