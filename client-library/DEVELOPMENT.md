# Development

To test the middleware package locally, without publishing it on npm, you can use either `npm link` or `npm pack`.

## `npm link`

Build and link the package locally (from the `client-library` folder)

```sh
# In the client-library folder
npm run build
npm link

# Change directories to another project that uses FPX Hono middleware
cd /path/to/test/project
npm link @fpx/hono
```

No need to install the package in your other project, just import it:

```ts
import { createHonoMiddleware } from "@fpx/hono";
```

Then, once you are done testing locally, remember to unlink the package

```sh
# check the link exists
npm ls -g --depth=0 --link=true
# remove the link
npm unlink @fpx/hono -g
```

## `npm pack`

This command will create a tarball that you can install as a file reference in another project.

```sh
npm pack
cd /path/to/other/projenct
# Replace the version command with the tarball that was created
npm install /path/to/client-library/@fpx-hono-x.y.z.tgz
```