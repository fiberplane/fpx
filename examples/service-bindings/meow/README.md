# Meow: Part of Service Bindings Example

This is a very simple Hono api that uses a service binding to call the `woof` service.

To run the example, first run `pnpm dev` in the `meow` directory, and then in a separate terminal run `pnpm dev` in the `woof` directory.

Notice that in `meow`'s `wrangler.toml`, we have:

```toml
bindings = [
  { name = "WOOF", binding = "woof" }
]
```

The name `"WOOF"` must match the `name` field in `woof`'s `wrangler.toml`.

Then, we expose `WOOF` as the binding, and tell Hono it's available via `c.env.WOOF`

```typescript
import type { WoofWorker } from "../../woof/src";

type Bindings = {
  WOOF: WoofWorker;
};
const app = new Hono<{ Bindings: Bindings }>();
```
