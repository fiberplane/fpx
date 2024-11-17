# @fiberplane/source-analysis

This package is intended for finding the hono routes/app instances in a give codebase

It uses the user's typescript library and configuration (but falls back to the bundled typescript version and the default compiler configuration).

## Known limitations

Given the current approach, the project this package is trying to analyze should:

* use typescript
* not use custom extensions (right now only `.ts` and `.tsx` is used)

## Goal of analyzing the source code

The goal is to find all routes of a users' hono application, knowing that we'd like to find out which code is actually used for that. This way we can provide an LLM with context around what the application accepts/uses (like database schema, zod validation schemas, etc). 

## Usage

The typical way of using it is as follows:

``` ts
import { createRoutesMonitor } from "@fiberplane/source-analysis"

const location = process.cwd();
const monitor = createRoutesMonitor(location);
monitor.start()
  .then(() => {
    console.log('ready');

    // By default the monitor will immediately start to analyze the code
    // and it will be made available via the `lastSuccessfulResult` 
    console.log(monitor.lastSuccessfulResult);

    // Force a manual update:
    monitor.updateRoutesResult();

    // Or you can also listen for "analysisStarted" and "analysisCompleted" events
    monitor.addListener("analysisCompleted", (event) => {
      if (event.payload.success) {
        console.log('Got this route factory', event.payload.factory)
      } else {
        console.log("Encountered the following error", event.payload.error /* string */),
      }
    });

    // In the end you can call stop on the monitor when it's no longer needed
    monitor.stop()
  })
```

The result of a successful analysis is a RoutesResult. This is an instance of a class that can be used to get a hono app which mimics all routes that have been found. When the hono instance receives a request, the `RoutesResult` instance will be updated with which routes have been called. You can then call the `getFilesForHistory` method on the `RouteResult` instance. This will generate a string containing (most) of the code that could be involved if that request was made to the actual application. 

``` ts
/* index.ts */
import { cors } from "hono/cors";
import { getProfile as getUserProfile } from "./db";
const app = new Hono();

app.get("/user/1/profile", cors()async (c) => {
  const profile = await getUserProfile();
  return c.json(profile);
}
/* EOF: index.ts */
/* db.ts */
import { measure } from "@fiberplane/hono-otel";
import { path } from "node:path";

const sleep = (duration = 100) =>
  new Promise((resolve) => setTimeout(resolve, duration))

export const getUser = measure("getUser", async () => {
  await sleep();

  // Do something silly with the path module
  const parent = path.resolve(__dirname, "..");
  console.log("parent folder", parent);
  const value = {
    name: "John Doe",
    email: "john@doe.com",
  };
  return value;
});

export async function getProfile() {
  const user = await getUser();
  await sleep(10);
  return {
    ...user,
    image: "https://xsgames.co/randomusers/avatar.php?g=pixel",
  };
}
/* EOF: db.ts */
```

As can be seen above it concatenates all files into a single file with some comments around the actually involved filenames.


## How it works

There are several strategies that we've been thinking about, specify the main entry of an application, find the hono app in that file and go through the source code from there. The downside there is that the entry file would need to be specified (or found out by our code base), The alternative is to analyze all source code and find variables that are of the `Hono<` generic type. This is the strategy this package uses

A high level description of the approach is:
* extracting routes. Go through all code and map all apps, routes, middleware and links between apps. Also keep track of what code is related to the app/route/middleware and keep track of what code that code might refer to (etc). All this is stored in a `ResourceManager` under the hood. 
* analyzing routes. Once all code has been converted into our own data structure, we find the hono apps and see which one has the most routes/entries (and if routes refer to each other their value is added as well). The app with the highest number is treated as the entry point.
* the final product: `RoutesResult`. This is contains:
  *  a reference to a hono app which can be used to find out what code is executed for a given method/request 
  * `getFilesForHistory()` method that can be called to see all code that can be executed for a request to an endpoint.
  * `resetHistory()` method so you can reset the result to the initial state.


### Extracting routes, the data structures

The `@fiberplane/source-analysis` package uses several key data structures to represent the elements of your TypeScript project. Understanding these data structures can be helpful if you want to work in this package.


#### `RouteTree`

The `RouteTree` type represents a reference to an `app` instance created with `new Hono()`. It contains a list of `entries`, which includes information about calls to the `app` (such as `app.get()`, `app.use()`, and `app.route()`).

```typescript
export type RouteTree = {
  id: RouteTreeId;
  type: "ROUTE_TREE";
  entries: RouteTreeEntry[];
  // other properties...
};
```

#### `RouteTreeEntry`

The `RouteTreeEntry` type represents an entry in a route tree. It can be one of the following types:

- `RouteEntry`. This represents a call to `app.get()`
- `RouteTreeReference`. This is the data structure for `app.route()`
- `MiddlewareEntry`. Represents calls to `app.use()`

```typescript
export type RouteTreeEntry = RouteEntry | RouteTreeReference | MiddlewareEntry;
```

#### Other data structures

In order to capture/store information about other code the packages uses two other data structures:

- `SourceReference` This is a reference to section of code (like a function, a constant, etc). A source reference, is 
- `ModuleReference` this represents a link to another file/external package and is typically (a part) of an import statement. 

All data structures (apart from `ModuleReference` can contain references to either modules or source references). 
