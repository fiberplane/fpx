# FPX Experimental Opentelemetry Client

> **Note:** This library is in alpha, and is still under development.

## Usage

Install the library in your project:

```bash
npm install @fiberplane/hono-otel
```

Wrap your Hono app with the `instrument` function:

```typescript
import { Hono } from "hono";
import { instrument } from "@fiberplane/hono-otel";

const app = new Hono();

app.get("/", (c) => c.text("Hello, Hono!"));

export default instrument(app);
```

If you're running in Cloudflare Workers, enable nodejs compatibility mode:

```toml
# Add this to the top level of your wrangler.toml
compatibility_flags = [ "nodejs_compat" ]
```

## Development

While developing within the monorepo, you can run a watcher on the src dir to automatically build the library:

```bash
cd client-library-otel
npm run watch
```

Then, point your sample app's package.json to the local build:

```json
{
  "dependencies": {
    "@fiberplane/hono-otel": "file:../fpx/client-library-otel"
  }
}
```