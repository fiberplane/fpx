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
npm i @fiberplane/hono
```

Add middleware to your project

```ts
import { Hono } from "hono";
import { createHonoMiddleware } from "@fiberplane/hono";

const app = new Hono();

app.use(createHonoMiddleware(app))

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default app;
```

Launch the FPX Studio UI

```sh
npx @fiberplane/studio
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
npm i @fiberplane/hono
```

### Add middleware

Add the `@fiberplane/hono` import, and then add middleware definitions **AT THE TOP OF YOUR APP**, ideally in your `src/index.ts`

If you only just started your project, you can copy paste the entire contents below into your `src/index.ts`:

```ts
import { Hono } from "hono";
import { createHonoMiddleware } from "@fiberplane/hono";

const app = new Hono();

const fpxConfig = {
  libraryDebugMode: false, // By default, do not print noisy debug logs
  monitor: {
    // This example would turn off auto-logging of fetch requests to FPX
    fetch: false,
    // This example keeps the default behavior of logging all requests to FPX
    requests: true,
  },
}

app.use(createHonoMiddleware(app, fpxConfig))
app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default app;
```


### Launch the FPX UI

You only need one command:

```sh
npx @fiberplane/studio
```

When you first run `npx @fiberplane/studio`, you'll be taken through a few initalization steps.

Visit the link to studio that's printed in your UI, and that's it! You should see your logs in the FPX UI.

Your configuration will be saved for the future.

If you ever want to change your configuration, you can do so by running `npx @fiberplane/studio` again, with the appropriate environment variables set:

```sh
# Launch the FPX Studio UI on a different port
FPX_PORT=8789 npx @fiberplane/studio

# Point the FPX Studio UI to your service, in order to autodetect its routes
FPX_SERVICE_TARGET=http://localhost:1234 npx @fiberplane/studio
```

### The `FPX_ENDPOINT` environment variable

The `FPX_ENDPOINT` environment variable controls where the FPX client library sends telemetry data.

If it is not defined, the middleware will do nothing. This means you can safely deploy your Hono app to any cloud environment, and by default, it will not send telemetry data.

The cli should help you initialize your project correctly, but if you want to connect your api to FPX Studio manually, you can add or modify this variable with, e.g., `FPX_ENDPOINT=http://localhost:8788/v0/logs` in your environment variable file.

```sh
echo -e '\nFPX_ENDPOINT=http://localhost:8788/v0/logs\n' >> .dev.vars
```

## Local Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for instructions on how to develop this library.