# Fiberplane API Playground

This is a single page application with the UI for Fiberplane's embedded api playground.

It requires an OpenAPI spec to power the UI.

It is similar to Fiberplane Studio, except it does **NOT** have the following features:

- Traces
- Logs
- AI Request Generations
- Request History
- Collections
- Code Intelligence

## Running

The playground is served/built with Vite and runs on port 6660

```bash
pnpm run dev
```

When you're running things locally, you can go to settings and enable a mock API spec for development. This allows you to test the playground with an OpenAPI spec without having to host one yourself.

## How we parse api specifications in production

When this UI is served in production, it attempts to parse an OpenAPI spec from the DOM, which should be embedded in a script tag as JSON.

See: `src/garbage/RequestorPage/queries/hooks/fiberplane-embedded/*` for the code that does this.

## Deploying

The built assets for the playground are ultimately copied over to `@fiberplane/embedded`'s `dist` folder, and then served from there when that package is published. (See: `packages/embedded` in this monorepo.)

In this monorepo's root, run `pnpm build:embedded` to build the playground and copy the assets over to `@fiberplane/embedded`'s `dist` folder.

Note that the `index.html` file in this package is not actually used in production. `@fiberplane/embedded` renders script tags that point to the playground `js` and `css` files in its own html document.