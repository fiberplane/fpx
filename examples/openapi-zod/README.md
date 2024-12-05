## Overview

This is an implementation of the Hono-Zod-OpenAPI integration from the Hono docs.

You can use it with Fiberplane Studio to get a feel for Studio's OpenAPI support.

For each documented route, a `Docs` tab should be available in the Studio UI.

## Commands

```sh
# HACK - This script initializes a D1 database *locally* so that we can mess with it
pnpm db:touch
pnpm db:generate
pnpm db:migrate
```

```sh
pnpm i
pnpm dev
```

To test with Studio, have this app running, and then when you launch the api:

```sh
cd api
FPX_WATCH_DIR=../examples/openapi-zod pnpm dev
```