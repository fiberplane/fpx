# Fiberplane API Playground

This is a single page application with the UI for Fiberplane's embedded api playground.

Important bits:

- Requires an OpenAPI spec to power the UI.
- When running the UI in this folder locally, you should also run a server on `:8787` that exposes an OpenAPI spec on the `/openapi.json` path. See [mies's fashion api](https://github.com/mies/fashion) as an example 

## Local Development

The playground is served/built with Vite and runs on port 6660

```bash
pnpm run dev
```

The UI relies entirely on having a valid OpenAPI spec to work with.

The way we know how to fetch the OpenAPI spec is by looking at the element in the DOM with the id `root`, and parsing the `data-options` attribute on it.

The `data-options` attribute should be a JSON object that describes how to fetch the OpenAPI spec. Either it is the raw spec itself, or it is a url from which the spec can be fetched.

Given the way we've set up the `index.html` file for local development here, we **assume that you're running a server on `:8787` that exposes an OpenAPI spec on the `/openapi.json` path**.

## Deploying

The built assets for the playground are ultimately copied over to `@fiberplane/hono`'s `dist` folder, and then served from there when that package is published. (See: `packages/embedded` in this monorepo.)

In this monorepo's root, run `pnpm build:embedded` to build the playground and copy the assets over to `@fiberplane/hono`'s `dist` folder.

Note that the `index.html` file in this package is not actually used in production. `@fiberplane/hono` renders script tags that point to the playground `js` and `css` files in its own html document.