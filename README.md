# Fiberplane Studio

<!-- TODO - REPLACE LOGO -->
![FPX](fpx.svg)

[website](https://fiberplane.com/)

Fiberplane Studio is a local tool for building and debugging Hono APIs. It can make requests against your api, inspect relevant runtime information when things go wrong, and help you build on the fly with confidence.

## Quick Start

Create Hono project
```sh
# Create a hono project, using cloudflare-workers runtime
npm create hono@latest my-hono-project
# > cloudflare-workers
```

Install the Fiberplane Hono Opentelemetry Library

```sh
cd my-hono-project
npm i @fiberplane/hono-otel@latest
```

Add it to your api

```ts
import { Hono } from "hono";
import { instrument } from "@fiberplane/hono-otel";

const app = new Hono();

app.get("/", (c) => c.text("Hello, Hono!"));

export default instrument(app);
```

Launch the Fiberplane Studio UI from your project directory

```sh
npx @fiberplane/studio@latest
```

Visit `http://localhost:8788` to make requests to your api, and see your logs and traces come in as you test your app!

***

Studio is designed to be used in conjunction with the [`@fiberplane/hono-otel` client library](https://www.npmjs.com/package/@fiberplane/hono-otel). You can read more about what it does in [that project's README](./packages/client-library-otel/README.md).

## Contributing

See [`DEVELOPMENT.md`](./DEVELOPMENT.md) for more details on how to run the Studio locally. Please get in touch via GitHub issues, or on the [Fiberplane Discord](https://discord.com/invite/cqdY6SpfVR), if you have any feedback or suggestions!

## License

All code within the `fpx` repository is distributed under the terms of
both the MIT license and the Apache License (Version 2.0).

See [LICENSE-APACHE](LICENSE-APACHE) and [LICENSE-MIT](LICENSE-MIT).
