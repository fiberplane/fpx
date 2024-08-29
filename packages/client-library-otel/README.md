# Fiberplane Hono Opentelemetry Library (BETA)

> **Note:** This library is in beta, and is still under active development.

This is a client library that will send telemetry data to a *local* Fiberplane Studio server upon every incoming request and outgoing response, in order to be visualized in the Studio UI.

Under the hood, it uses [OpenTelemetry](https://opentelemetry.io/) traces to collect telemetry data and send it to a local FPX server.

By default, it proxies `console.*` functions to send logging data to a local Fiberplane Studio server, 
so any time you use a `console.log`, `console.error`, etc., in your app, it will also send those log messages to FPX.

Likewise, any time your app makes a `fetch` request, it will create a trace for that request. This behavior is configurable.

The library is a no-op when the `FPX_ENDPOINT` environment variable is not present, so it is safe to deploy to production.

## Quick Start

Create Hono project
```sh
# Create a hono project, using cloudflare-workers runtime
npm create hono@latest my-hono-project
# > cloudflare-workers
```

Install the Fiberplane Hono Opentelemetry Library

```sh
npm i @fiberplane/hono-otel@beta
```

Add middleware to your project

```ts
import { Hono } from "hono";
import { instrument } from "@fiberplane/hono-otel";

const app = new Hono();

app.get("/", (c) => c.text("Hello, Hono!"));

export default instrument(app);
```

Launch the Fiberplane Studio UI from your project directory

```sh
npx @fiberplane/studio
```

Visit `http://localhost:8788` to see your logs and traces come in as you test your app!

## Usage

This section takes you through:

- Installing the Fiberplane Hono Opentelemetry Library
- Configuring your project to use Fiberplane Studio
- Advanced usage with custom spans

It assumes you already have a Hono app running locally.

### Installation

Install the library in your project. At writing, the library is in beta, so you need to install it with the `@beta` tag:

```bash
npm install @fiberplane/hono-otel@beta
```

Wrap your Hono app with the `instrument` function:

```typescript
import { Hono } from "hono";
import { instrument } from "@fiberplane/hono-otel";

const app = new Hono();

app.get("/", (c) => c.text("Hello, Hono!"));

// Other routes and middleware can be added here

export default instrument(app);
```

### Configuration

If you're running in Cloudflare Workers, enable nodejs compatibility mode. (This is done automatically for you when you run `npx @fiberplane/studio`.)

```toml
# Add this to the top level of your wrangler.toml
compatibility_flags = [ "nodejs_compat" ]
```

#### The `FPX_ENDPOINT` Environment Variable

When your app is running, the `FPX_ENDPOINT` environment variable controls where the FPX client library sends telemetry data.

If it is not defined, the middleware will do nothing. This means you can safely deploy your Hono app to any cloud environment, and by default, it will not collect and send telemetry data.

The Fiberplane cli (`npx @fiberplane/studio`) should help you initialize your project correctly, but if you want to connect your api to Fiberplane Studio manually, you can add or modify this variable with, e.g., `FPX_ENDPOINT=http://localhost:8788/v1/traces` in your environment variable file.

```sh
echo -e '\nFPX_ENDPOINT=http://localhost:8788/v1/traces\n' >> .dev.vars
```

#### Additional Configuration

When you instrument your app, you can also pass in a configuration object to override the default behavior of the `instrument` function.

The options are:

- `monitor.fetch`: Whether to create traces for all fetch requests. (Default: `true`)
- `monitor.logging`: Whether to proxy `console.*` functions to send logging data to a local Fiberplane Studio server. (Default: `true`)
- `monitor.cfBindings`: Whether to proxy Cloudflare bindings (D1, R2, KV, AI) to add instrumentation to them. (Default: `false`)
- `libraryDebugMode`: Whether to enable debug logging in the library. (Default: `false`)

Here is an example:

```typescript
import { Hono } from "hono";
import { instrument } from "@fiberplane/hono-otel";

const app = new Hono();

app.get("/", (c) => c.text("Hello, Hono!"));

export default instrument(app, {
  // Enable debug logging in the library
  libraryDebugMode: true,
  monitor: {
    // Don't create traces for fetch requests
    fetch: false,
    // Don't proxy `console.*` functions to send logging data to a local FPX server
    logging: false,
    // Proxy Cloudflare bindings (D1, R2, KV, AI) to add instrumentation to them
    cfBindings: true,
  },
});
```

#### The `FPX_LOG_LEVEL` Environment Variable

The `FPX_LOG_LEVEL` environment variable controls the verbosity of the library's logging.

The possible values are: `debug`, `info`, `warn`, and `error`.

The default value is `warn`.

The `libraryDebugMode` option (documented in the previous section), takes precedence over this environment variable.

### Advanced Usage: Custom Spans with `measure`

The library also allows you to create custom spans for any function in your app.

To make use of this feature, you need to import the `measure` function from the library and wrap your function with it.

```typescript
import { instrument, measure } from "@fiberplane/hono-otel";

const app = new Hono();

// Create a loop function that will get recorded as a span inside the trace for a incoming given request
const loop = measure("loop", (n: number) => {
  for (let i = 0; i < n; i++) {
    console.log(`Loop iteration: ${i}`);
  }
});

app.get("/", (c) => {
  loop(100);
  return c.text("Hello, Hono!");
});

export default instrument(app);
```

## Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for instructions on how to develop this library.