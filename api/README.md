
## Running mizu

```sh
npm install
npm run db:generate
npm run db:migrate

# NOTE - This app runs Hono in a Node.js execution context by default,
#        Since we need access to the filesystem to do fun stuff
npm run dev 
```


### Adding some AI

- Get an OpenAI API Key
- Add it to `.dev.vars`
- Voilà

## Publishing

### Testing npx command locally

```sh
# From the fpx PROJECT ROOT!
npm run build:mizu-studio
cd api
npm link

# Test it out
cd /some/random/dir
npx mizu

# If you need to use a different port
MIZU_PORT=8790 npx mizu

# To unlink afterwards, first find the linked package name (something like @mizu-dev/studio)
# then use that name in the `npm unlink` command
npm ls -g --depth=0 --link=true
npm unlink $NAME_OF_THIS_PACKAGE -g
```

### Officially publishing

```sh
# ***Start in the fpx project root!***
npm run build:mizu-studio
cd api
npm publish

# Then test like this
cd /some/random/dir
npx @mizu-dev/studio
```