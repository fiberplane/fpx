# fpx studio

fpx studio is a local-first tool for building and debugging Hono apis. It enables you to quickly make requests against your api, inspect relevant runtime information when things go wrong, and build on the fly with confidence.

Launch the studio via `npx` in the root directory of your Hono project:

```sh
cd my-hono-project
npx @fiberplane/studio
```

If it's your first time running the cli, it will ask you for some configuration details. After that, a local web app will open on `http://localhost:8788`.

`fpx` is designed to be used in conjunction with the [`@fiberplane/hono` middleware](https://www.npmjs.com/package/@fiberplane/hono). Adding that middleware is a breeze, and you can read more about it in the project's README.

## Contributing

See the [`DEVELOPMENT.md`](./DEVELOPMENT.md) file for more details on how to _develop_ the studio locally. Please get in touch via GitHub issues, or on the [Fiberplane Discord](https://discord.com/invite/cqdY6SpfVR), if you have any feedback or suggestions!

## License

All code within the `fpx` repository is distributed under the terms of
both the MIT license and the Apache License (Version 2.0).

See [LICENSE-APACHE](LICENSE-APACHE) and [LICENSE-MIT](LICENSE-MIT).
