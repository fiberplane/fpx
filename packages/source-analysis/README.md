# @fiberplane/source-analysis

This package is intended for finding the hono routes/app instances in a give codebase. This was initially created to provide context for requests to an LLM. In studio you can use an LLM to generate parameters for your request. However there is more that studio can do with this knowledge, things like providing links to the source code of an endpoint, grouping routes based on location in the source code and more.

This package uses the user's typescript library and configuration (but falls back to the bundled typescript version and the default compiler configuration). Both: the typescript language service as well as the compiler API is being used. The language service is used to find references within the code base and the other for getting the AST tree, access the type checker, etc. 

## Known limitations

Given the current approach, the project this package is trying to analyze should:

* use typescript
* use standard typescript file extensions (right now only `.ts` and `.tsx` is used)

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
    // All files have been found 
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

The result of a successful analysis is a RoutesResult. This is an instance of a class that can be used to get a hono app which mimics all routes that have been found. When the hono instance receives a request, the `RoutesResult` instance will be updated with which routes have been called. You can then call the `getFilesForHistory` method on the `RoutesResult` instance. This will generate a string containing (most) of the code that could be involved if that request was made to the actual application. 

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


There are several strategies that we've been thinking about, one approach is to specify the main entry of an application, find the hono app in that file and go through the source code from there. The downside to this, is that the entry file would need to be specified (or found out by our code base).
An alternative approach is to analyze all source code and find variables that are of the `Hono<` generic type and use some heuristics to determine the entry point/main app. This is the strategy this package uses.
On a high level what needs to happen is as follows:
1. extracting routes. Go through all code and map all apps, routes, middleware and links between apps. Also keep track of what code is related to the app/route/middleware and keep track of what code that code might refer to (etc). This data is stored in the `ResourceManager`. 
2. analyzing routes. Once all code has been converted into our own data structure, we find the hono apps and see which one has the most routes/entries (and if routes refer to each other their value is added as well). The app with the highest number is treated as the entry point.
3. the intermediate result: `RoutesResult`. This contains:

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

- `SourceReference` This is a reference to section of code (like a function, a constant, etc).  A source reference can refer to one or more `SourceReference` as well as one or more `ModuleReferences`
- A `ModuleReference` represents a link to another file/external package and is source code (part of) an import statement. 

All data structures (apart from `ModuleReference` can contain references to either modules or source references) . All resources are stored using their id in a `Map` in the ResourceManager. Although `ID`s are basically strings -which always start with the basic type like `ROUTE_TREE`, `SOURCE_REFERENCE`, etc - in typescript land they are made specific using [type tagging](https://medium.com/@KevinBGreene/surviving-the-typescript-ecosystem-branding-and-type-tagging-6cf6e516523d) (using type-fest). This way typescript is aware what kind of a resource is being returned when calling `ResourceManager.getResource`.

## Extracting the code for a route

After creating the resources based on the source code, the main entry endpoint is determined. That main entry point is then used in the `RoutesResult` to set up a separate Hono app. This hono app is never actually listening on a port but is used to send requests to.  The reconstructed app could be written out something like this:

``` ts
type HistoryId =
  | RouteEntryId
  | RouteTreeId
  | RouteTreeReferenceId
  | MiddlewareEntryId;
const history: Array<HistoryId> = [];

const routingApp = new Hono();
routingApp.use((_, next) => {
  // Append main RouteTreeId to history
  history.push("SOME_ROUTE_TREE_ID");
  return next();
});

routingApp.get("/", (c) => {
  // Append RouteEntryId to history
  history.push("SOME_ROUTE_ENTRY_ID");
  return c.text("Ok");
});

routingApp.get("/profile", () => {
  // Append  RouteEntryId to history
  history.push("SOME_OTHER_ROUTE_ENTRY_ID");
  return c.text("Ok");
});
```

Now, if the `routingApp` handles a request, the history array will contain all IDs involved in handling a request for a specific method/URL. Given those IDs, it is possible to generate the code by converting the data structures back into code and include all things that these structures refer to. This way only code is included that might actually get executed for the request.

## Performance

On smaller projects, the source code analysis is quite fast, it might take even less than 100ms. 
However on larger code bases it some calls can suddenly become slow/expensive. One such call is `getProgram`, it's a method on the language service and returns a compiler instance. Even on tiny projects this call can take ~50ms, so the approach taken here is to call `getProgram` as few times as possible and as early as possible. Another thing is the `tsconfig.json` has quite a significant performance impact, especially specifying types using `compilerOptions.types`. Adding `node` types for the simplest project in the test suite added 5ms to the test (bumping it to around 50ms). This brings us to another optimization that was done for larger projects: caching results for `readFile`, `fileExists` and `directoryExists`. These calls happen a lot, while typescript is trying to figure out for instance whether a package exists and where.
So in case of this package, we cache the results of this calls while parsing the source code and reset it when files change on the filesystem.

# The future

It would be nice if we could do things like incremental analysis, right now the second time a code basis is analyzed it is typically a bit faster, but we could simply only analyze files that are related to the files that have been changed since the last time the analysis completed. Even further in the future it could be interesting to use a language that's more performant like Rust that can parse typescript.

## Open issues/known limitations:

* Test if path aliases (`compilerOptions.paths`) actually work (https://www.typescriptlang.org/tsconfig/#paths)
* ensure export statements are included in the generated result. Right now for instance apps are found, but we don't really check if/how they are exported, cases where a variable declared and the export is done elsewhere are probably not covered.
* classes have not been thoroughly tested. This means it could break code 
* `.on` calls aren't being handled
