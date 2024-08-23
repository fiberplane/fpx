## Setup

Configure

```sh
touch .dev.vars
# Be sure to initialize with the correct fpx endpoint
echo "FPX_ENDPOINT=http://localhost:8788/v1/traces" >> .dev.vars
```

Run

```sh
pnpm i
pnpm dev
```

Inspect

```sh
open http://localhost:3003
```

## Developing with Fiberplane Studio

From this monorepo's root:

```sh
FPX_WATCH_DIR=../sample-apps/stressy-mcstress-face FPX_SERVICE_TARGET=3003 pnpm dev:api
```