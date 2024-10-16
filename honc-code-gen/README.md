# Honc Code Generation API

This is the API that powers the Honc Code Generation features in the revamped cli.

## Testing Locally

Configure `.dev.vars` with an Anthropic API key.

```sh
ANTHROPIC_API_KEY=<api-key>
```

Start the api

```sh
pnpm dev
```

Point the cli at the local api

```sh
cd ../cli
HONC_BASE_URL=http://localhost:4468 pnpm dev
```



## Deployment

Set the Anthropic API key and Honc password in the production wrangler environment:

```sh
pnpx wrangler secret put ANTHROPIC_API_KEY
```

```sh
pnpx wrangler secret put HONC_PASSWORD
```
