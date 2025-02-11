<img src="https://avatars.githubusercontent.com/u/61152955?s=200&v=4" alt="Fiberplane Logo" width="50" />

# Fiberplane

Fiberplane is an embeddable API playground for Hono apis. Install `@fiberplane/hono`, point its middleware to your OpenAPI spec, and you're off to the races.

![CleanShot 2025-02-11 at 14 15 29@2x](https://github.com/user-attachments/assets/2a21daa4-a25d-4398-9cd1-01bcb1714210)

## Quick Start

Install the package with your favorite package manager:

```sh
pnpm add @fiberplane/hono
```

Mount the middleware to your Hono app:

```ts
import { createFiberplane } from "@fiberplane/hono";

const app = new Hono();

app.get("/openapi.json", () => {
  // ... return your openapi spec here ...
});

app.use("/fp/*", fiberplane({
  openapi: { url: "/openapi.json" },
}));

export default app;
```

Visit your app at `http://localhost:8787/fp` to see the Fiberplane UI.

## Features

- Access built-in interactive documentation
- Automatically discover routes via OpenAPI spec and show these as human readable CRUD operations
- Generate a request to test end points in real time
- Add authentication headers and re-use these throughout requests
- Quickly navigate with keyboard navigation and shortcuts
- Switch between beautiful themes for light and dark mode

## Contributing

Interested in contributing? Please get in touch via GitHub issues, or on the [Fiberplane Discord](https://discord.com/invite/cqdY6SpfVR). We are very responsive to feedback and suggestions!

## License

All code within the `fiberplane` repository is distributed under the terms of
both the MIT license and the Apache License (Version 2.0).

See [LICENSE-APACHE](LICENSE-APACHE) and [LICENSE-MIT](LICENSE-MIT).
