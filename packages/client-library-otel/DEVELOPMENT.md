# Development

While developing within the fpx monorepo, you can run a watcher on the src dir to automatically build the library:

```bash
cd client-library-otel
pnpm watch
```

Then, if your app is within the monorepo, point your app's package.json to the local build:

```json
{
  "dependencies": {
    "@fiberplane/hono-otel": "workspace:*"
  }
}
```

Otherwise, if you want to test against an api outside of the monorepo, you can install the library from the local build:

```json
{
  "dependencies": {
    "@fiberplane/hono-otel": "file:../path/to/fpx/packages/client-library-otel"
  }
}
```

## Sample App

The `sample` directory contains a sample Hono app that you can use to test the library.

To run the sample app, simply run `pnpm run dev` inside this directory, which will connect your app to the FPX Studio api running on `http://localhost:8788`, assuming it is running. You can make requests against the sample app and see the spans recorded in the FPX Studio UI.

