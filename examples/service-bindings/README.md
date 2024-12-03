# Service Bindings Example

In this folder there are two Workers, `woof` and `meow`.

`meow` is a Hono api that uses `woof` as a [service binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/), which is, it calls 

`woof` is a simple service that can bark and sniff.

To run the example, run `pnpm dev` in the `meow` directory, and then in a separate terminal run `pnpm dev` in the `woof` directory.

In your terminal for `meow`, it should list `WOOF` as being a connected service, once `woof` is running.