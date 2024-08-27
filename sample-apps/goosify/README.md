## Overviews

This is a Cloudflare mega-app. 

It is also goose themed.

It allows us to test instrumentation for the following CF bindings:

- D1
- R2
- KV
- AI SDK

There is some trickiness in getting Drizzle to work with a local D1, so be mindful that this setup might break.

There is some plumbing in place to deploy to prod, but that's not what this is meant for rn.

You'll need a CF account to run this with the AI binding.

## Commands
```sh
pnpm i
pnpm dev
```

```sh
# HACK - This script initializes a D1 database *locally* so that we can mess with it
pnpm db:touch
pnpm db:generate
pnpm db:migrate
```
