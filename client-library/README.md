# Mizu Client

This is a client library that will send telemetry data to the Mizu server (in `../api`).

Note that it monkey-patches `console.*` functions to send logs to the Mizu server.

So, any time you use a `console.log`, `console.error`, etc., in your app, we will send that data to Mizu!

This readme takes you through:

- Creating a Hono Project
- Adding the mizu "client library"
- Configuring your project to use mizu

## Create a Hono project

Create a new Hono project with the following command. When prompted, choose `cloudflare-workers` as the template.

```sh
npm create hono@latest my-hono-project
```

## Install the mizu client

### Copy the `mizu.ts` file
To install the mizu client, add this package as a dependency:

``` bash
npm install 'https://gitpkg.now.sh/brettimus/mizu/client-library?client-package-refactor'

# or with yarn:
yarn add 'https://gitpkg.now.sh/brettimus/mizu/client-library?client-package-refactor'
```

### Trouble getting the latest version

If you're not getting the latest version, it might be that your package manager is caching an older version of the package.  As a work around you may want to clear your local cache by running something like `yarn cache clean`

### Add middleware

Add the mizu import, and then add middleware definitions **AT THE TOP OF YOUR APP**, ideally in your `src/index.ts`

If you only just started your project, you can copy paste the entire contents below into your `src/index.ts`:

```ts
import { Context, Hono } from "hono";
import { createHonoMiddleware } from "mizu";

const app = new Hono();

const createConfig = (c: Context) => {
 return {
  endpoint: c.env?.MIZU_ENDPOINT,
  service: c.env?.SERVICE_NAME || "unknown",
  libraryDebugMode: c.env?.LIBRARY_DEBUG_MODE,
  monitor: {
   fetch: true,
   logging: true,
   requests: true,
  },
 };
}

app.use(createHonoMiddleware({ createConfig }))
app.get("/", (c) => {
	return c.text("Hello Hono!");
});

export default app;
```

## Add `MIZU_ENDPOINT` environment variable

Add `MIZU_ENDPOINT=http://localhost:8788/v0/logs` to your `.dev.vars` file!

```sh
echo -e '\nMIZU_ENDPOINT=http://localhost:8788/v0/logs\n' >> .dev.vars
```

You should be good to go! Just execute `npm run dev` to kick off your new Hono project..

Make requests to your Hono app, and the logs should show up in the Mizu UI at `http://localhost:5173`!
