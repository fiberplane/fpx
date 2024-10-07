## Overview

This is a Hono app that can be used to test static analysis utilities for the Fiberplane Studio API.

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
