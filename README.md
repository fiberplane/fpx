# Fiberplane Studio

<!-- TODO - REPLACE LOGO -->
![FPX](fpx.svg)

[website](https://fiberplane.com/)

Fiberplane Studio is a local  tool for building and debugging Hono apis. It can make requests against your api, inspect relevant runtime information when things go wrong, and help you build on the fly with confidence.

## Get Started

Launch the studio via `npx` in the root directory of your Hono project:

```sh
cd my-hono-project
npx @fiberplane/studio@beta
```

If it's your first time running the cli, it will ask you for some configuration details. After that, a local web app will open on `http://localhost:8788`.

Studio is designed to be used in conjunction with the [`@fiberplane/hono-otel` middleware](https://www.npmjs.com/package/@fiberplane/hono-otel). Adding that middleware is a breeze, and you can read more about it in [the project's README](./packages/client-library-otel/README.md).

## Contributing

See the [`DEVELOPMENT.md`](./DEVELOPMENT.md) file for more details on how to _develop_ the Studio locally. Please get in touch via GitHub issues, or on the [Fiberplane Discord](https://discord.com/invite/cqdY6SpfVR), if you have any feedback or suggestions!

## License

All code within the `fpx` repository is distributed under the terms of
both the MIT license and the Apache License (Version 2.0).

See [LICENSE-APACHE](LICENSE-APACHE) and [LICENSE-MIT](LICENSE-MIT).
