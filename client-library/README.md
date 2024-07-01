# FPX Hono Middleware

This is a client library that will send telemetry data to a *local* FPX server upon every incoming request and outgoing response.

Note that it also monkey-patches `console.*` functions to send events to a local FPX server, 
so any time you use a `console.log`, `console.error`, etc., in your app, it will send that data to FPX.

## Quick Start

Create Hono project
```sh
# Create a hono project, using cloudflare-workers runtime
npm create hono@latest my-hono-project
# > cloudflare-workers
```

Install middleware

```sh
npm i @fpx/hono
```

Add middleware

```ts
import { Hono } from "hono";
import { createHonoMiddleware } from "@fpx/hono";

const app = new Hono();

app.use(createHonoMiddleware(app))

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default app;
```

Launch UI

```sh
npx @fpx/studio
```

Visit `http://localhost:8788` to see your logs come in as you test your app!

## Usage

This section takes you through:

- Creating a Hono Project
- Installing the FPX Hono Middleware
- **Configuring** your project to use FPX
- Launching the FPX UI locally

### Create a Hono project

Create a new Hono project with the following command. When prompted, choose `cloudflare-workers` as the template.

```sh
npm create hono@latest my-hono-project
# > cloudflare-workers
```

### Install the FPX Hono Middleware

```sh
npm i @fpx/hono
```

### Add middleware

Add the `@fpx/hono` import, and then add middleware definitions **AT THE TOP OF YOUR APP**, ideally in your `src/index.ts`

If you only just started your project, you can copy paste the entire contents below into your `src/index.ts`:

```ts
import { type Context, Hono } from "hono";
import { createHonoMiddleware } from "@fpx/hono";

const app = new Hono();

const createConfig = (c: Context) => {
 return {
  endpoint: c.env?.FPX_ENDPOINT,
  service: c.env?.FPX_SERVICE_NAME || "unknown",
  libraryDebugMode: c.env?.LIBRARY_DEBUG_MODE,
  monitor: {
   fetch: true, // set to false if you do not want to monkey-path fetch and send data about external network requests to FPX
   logging: true, // not yet implemented!
   requests: true, // set to false if you do not want to log data about each request and response to FPX
  },
 };
}

app.use(createHonoMiddleware(app, { createConfig }))
app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default app;
```

### Add `FPX_ENDPOINT` environment variable

Add `FPX_ENDPOINT=http://localhost:8788/v0/logs` to your `.dev.vars` file. E.g.,

```sh
echo -e '\nFPX_ENDPOINT=http://localhost:8788/v0/logs\n' >> .dev.vars
```

You should be good to go! Just execute `npm run dev` to kick off your new Hono project..

Make requests to your Hono app, and the logs should show up in the FPX UI!

### Launch the FPX UI

```sh
npx @fpx/studio

# Launch the UI on a different port
FPX_PORT=8789 npx @fpx/studio

# Point the UI to your service, to autodetect its routes
FPX_SERVICE_TARGET=http://localhost:1234 npx @fpx/studio
```

That's it! You should see your logs in the FPX UI.

## Local Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for instructions on how to develop this library.