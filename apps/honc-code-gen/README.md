# Honc Code Generation API and Playground

This is the API that powers the Honc Code Generation features in the create-honc-app cli.

There is also a separate "playground" project that is used to test the code generation steps.

## API

### Testing API Locally

Configure `.dev.vars` with an OpenAI API key and enable "is local" flag.

Enable the v1 code generation feature if you're working on that api:

```sh
OPENAI_API_KEY=<api-key>
HONC_IS_LOCAL=true
# Optional - only if you're working on the v1 api
HONC_CODE_GEN_V1_ENABLED=true
```

Start the api

```sh
pnpm dev
```

Point the create-honc-app cli at the local api

```sh
cd ../../create-honc-app
HONC_BASE_URL=http://localhost:4468 pnpm dev
```

### Deployment

Set the OpenAI API key and Honc password in the production wrangler environment:

```sh
pnpx wrangler secret put OPENAI_API_KEY
```

To add a Honc password, which needs to be set in the `create-honc-app` cli, run:

```sh
pnpx wrangler secret put HONC_PASSWORD
```

To disable password protection, set the `HONC_IS_LOCAL` secret to `true`.

```sh
pnpx wrangler secret put HONC_IS_LOCAL
```

To turn on the V1 code generation feature (**note: this is not yet ready for production use as of writing**), set the `HONC_CODE_GEN_V1_ENABLED` secret to `true`.

```sh
pnpx wrangler secret put HONC_CODE_GEN_V1_ENABLED
```

## Playground

> Contact Brett before playing in the playground. It will be easier to go through the setup process together.

The "playground" is a separate project that is used to test the code generation API. It is not deployed to Cloudflare.

This includes scripts for testing out the code generation tasks, as well as a local RAG setup.

Look at the package.json for scripts to test the code generation tasks, and feel free to add your own.

There are some utilities for inspecting the generated files from the CLI. Look inside code-gen/utils.

### RAG

For indexing documentation, you'll need to clone the Cloudflare docs repo and the Drizzle docs repo, then adjust the hardcoded paths in the scripts referenced by `play:index:cloudflare` and `play:index:drizzle`.

This creates a local persistence folder for the document vectors and indexes. (This folder is ignored by git by default.)

When indexing Cloudflare documentation, there might be disallowed tokens in some of the docs. You should manually remove these (for now) if you hit such an error. Just look for whatever token llamaindex complains about.