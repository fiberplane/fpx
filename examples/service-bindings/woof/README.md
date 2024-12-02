# Woof: Part of Service Bindings Example

`Woof` is a simple worker that is bound to `meow` via [Cloudflare's worker service bindings](https://developers.cloudflare.com/workers/runtime-apis/service-bindings/).

Note that the `name` field in `wrangler.toml` must match the name used in `meow` to bind to this worker.

So in this worker's `wrangler.toml`, we have:

```toml
name = "woof" # NOTE - Use this name inside `meow` to bind to this worker
```

And in `meow`'s `wrangler.toml`, we have:

```toml
bindings = [
  { name = "WOOF", binding = "woof" }
]
```
