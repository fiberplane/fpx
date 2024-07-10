## Running fpx

To run this project locally, follow these commands:

```sh
npm install
npm run db:generate
npm run db:migrate

# NOTE - This app runs Hono in a Node.js execution context by default,
#        Since we need access to the filesystem to do fun stuff
npm run dev 

# If you want more granular logging locally, you can set the FPX_LOG_LEVEL env var
# (This will also be read from .dev.vars)
FPX_LOG_LEVEL=debug npm run dev
```

### Adding some AI

- Get an OpenAI API Key
- Add it to `.dev.vars`
- Voilà

## Publishing

### Testing the npx command locally

```sh
# From the fpx PROJECT ROOT!
npm run build:fpx-studio
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
npm run build:fpx-studio
cd api
npm publish

# Then test like this
cd /some/random/dir
npx @fiberplane/studio
```