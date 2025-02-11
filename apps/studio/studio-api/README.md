## Running fpx

To run this project locally, follow these commands:

```sh
pnpm install
pnpm db:generate
pnpm db:migrate

# NOTE - You will usually test against a local API
#        For route detection to work, you need to set FPX_WATCH_DIR
#        This can also be set in .dev.vars
FPX_WATCH_DIR=../../path/to/example/api pnpm dev
```

## Publishing

### Testing the npx command locally

```sh
# From the fpx PROJECT ROOT!
pnpm build:fpx-studio
cd api
npm link

# Test it out
cd /some/random/dir
npx --prefer-local fpx

# If you need to serve the api on a different port
FPX_PORT=8790 npx --prefer-local fpx

# If your service is running on something other than http://localhost:8787
FPX_SERVICE_TARGET=http://localhost:1234 npx --prefer-local fpx

# To unlink afterwards, first find the linked package name (something like @fiberplane/studio)
# then use that name in the `npm unlink` command
npm ls -g --depth=0 --link=true
npm unlink $NAME_OF_THIS_PACKAGE -g
```

### Officially publishing

```sh
# ***Start in the fpx project root!***
pnpm build:fpx-studio
cd api
pnpm publish

# Then test like this
cd /some/random/dir
npx @fiberplane/studio
```
