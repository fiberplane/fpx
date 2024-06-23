# Mizu Client

This is a client library that will send telemetry data to a *local* Mizu server upon every incoming request and outgoing response.

Note that it also monkey-patches `console.*` functions to send logs to the Mizu server, 
so any time you use a `console.log`, `console.error`, etc., in your app, it will send that data to Mizu.

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

app.use(createHonoMiddleware(app))

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

## Usage

This section takes you through:

- Creating a Hono Project
- Installing the mizu client library
- **Configuring** your project to use mizu
- Launching the mizu UI

### Create a Hono project

Create a new Hono project with the following command. When prompted, choose `cloudflare-workers` as the template.

```sh
npm create hono@latest my-hono-project
# > cloudflare-workers
```

### Install the mizu client

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
   fetch: true, // set to false if you do not want to monkey-path fetch and send data about external network requests to mizu
   logging: true, // not yet implemented!
   requests: true, // set to false if you do not want to log data about each request and response to mizu
  },
 };
}

app.use(createHonoMiddleware(app, { createConfig }))
app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default app;
```

### Add `MIZU_ENDPOINT` environment variable

Add `MIZU_ENDPOINT=http://localhost:8788/v0/logs` to your `.dev.vars` file. E.g.,

```sh
echo -e '\nMIZU_ENDPOINT=http://localhost:8788/v0/logs\n' >> .dev.vars
```

You should be good to go! Just execute `npm run dev` to kick off your new Hono project..

Make requests to your Hono app, and the logs should show up in the mizu UI!

### Launch the mizu UI

```sh
npx @mizu-dev/studio

# Launch the UI on a different port
MIZU_PORT=8789 npx @mizu-dev/studio

# Point the UI to your service, to autodetect its routes
MIZU_SERVICE_TARGET=http://localhost:1234 npx @mizu-dev/studio
```

That's it! You should see your logs in the mizu UI.

## Local Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for instructions on how to develop this library.