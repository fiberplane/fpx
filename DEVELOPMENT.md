# Fiberplane

Welcome to the Fiberplane monorepo!

## Developing

This project uses typescript, biome and pnpm workspaces. Linting and formatting is handled with [biome](https://biomejs.dev/).

In the project root you can format all typescript codebases with `pnpm run format`.

You will also want to use the project root to prepare the npx command for the distributable API. See the root's `package.json` scripts, as well as the api's README for more details on testing the npx command.

Always publish with `pnpm publish`.

If you've updated the code in `packages/types`, you'll need to publish a new version of the package before publishing any other packages that depend on it.


## Projects

### Fiberplane `@fiberplane/hono`

The `@fiberplane/hono` package is a library for embedding a Fiberplane API Explorer into your Hono app.

The package that is published to npm is in `packages/fiberplane-hono`.

The frontend that is bundled with the package is in `packages/playground`

### Fiberplane Studio

`apps/studio` contains an api and a frontend that can consume telemetry data from a Hono app.

To connect your Hono app to the Studio api, you'll need to add the code in [`packages/client-library-otel`](./packages/client-library-otel) to your Hono app. You can do this via NPM, or linking to the local codebase. Please read [the client library README.md](./packages/client-library-otel/README.md) for instructions.

Worth noting is that the api connects to a local libsql (sqlite) database. Setup steps for this are simple (you just need to run migrations), and are in [api/README.md](./api/README.md).

The frontend is a React + Typescript + Tailwind app that uses [shadcn/ui](https://ui.shadcn.com/) components. For more info on the frontend, see: [studio-frontend/README.md](./studio/studio-frontend/README.md).

There are also folders containing:

- `packages/types` - The shared typescript types (and constants) used across the projects in the monorepo
- `apps/webhonc`- A proxy service for sending requests to your Hono app from a static public url
- `www` - The documentation website for Studio

#### Setup

Let's focus on running the Studio api and frontend for now.

You'll want to

1. Run the code in this repo, and then
2. Add some client code to a Hono app

The next two sections take you through how to do this.

#### Spinning up the database, api, and dashboard

1. Clone this repo
1. `cd api` and spin up the api (follow instructions in [api/README](./api/README.md))
1. Check the api is running on `http://localhost:8788`
1. `cd frontend` in a separate shell, and spin up the frontend (follow instructions in in [frontend/README](./frontend/README.md))
1. Check the frontend is running on `http://localhost:5173`

#### Adding Fiberplane Studio to your Hono project

Follow the instructions in the [`client-library-otel` README](./packages/client-library-otel/README.md) to add FPX telemetry to your Hono project.


## License

All code within the `fiberplane` repository is distributed under the terms of
both the MIT license and the Apache License (Version 2.0).

See [LICENSE-APACHE](LICENSE-APACHE) and [LICENSE-MIT](LICENSE-MIT).
