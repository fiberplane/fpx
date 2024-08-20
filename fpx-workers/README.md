# fpx-workers

The fpx-workers crate is an implementation of the HTTP OTEL ingestion endpoint.
Currently both JSON and Protocol Buffers encoding are supported. gRPC is not
supported for the fpx-workers.

This crate also includes the Rest endpoints to retrieve the traces and a
web-socket endpoint to receive realtime notification about newly added traces.

## Local development

To get started you will need to make sure that you have Rust installed and you
need wrangler. See their respective documentation for installation instructions.

Using the wrangler CLI you need to create a new D1 database to use and then
apply all the migrations on it:

```
npx wrangler d1 create DB
npx wrangler d1 migrations apply DB
```

You only need to create the database once and you may need to apply any newly
added migrations.

Now you can simply run the worker using the wrangler CLI:

```
npx wrangler dev
```

The Rust code will be compiled and once that is finished a local server will be
running on `http://localhost:8787`. You can send traces using any otel exporter
and inspect the traces using the [`fpx client`](../fpx).

## Deploying to Cloudflare

If you want to deploy this worker to Cloudflare you will require a paid account
(since this is using durable objects). You still need to go through the same
steps to create a database, and after that you will need to run the following
command:

```
npx wrangler deploy
```

Once the compilation and upload is finished, you will be informed about the URL
where the worker is running. Optionally you can use `--name` to use a different
name for the worker (if you want to run multiple instances, for different
environments).
