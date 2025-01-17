# Lilo Frontend

This is the frontend for Lilo. It's built with Vite and React.

## HACKS

We need to include `@types/node` and `@cloudflare/workers-types` in the types array in `tsconfig.app.json` because Hono RPC client imports types from it.

I think this means the frontend build will not throw typescript errors when you import node builtins or Cloudflare Workers types. Beware.
