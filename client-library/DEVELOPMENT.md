To test the middleware package locally, you can use either `npm link` or `npm pack`.

## `npm link`

Build and link the package locally (from the `client-library` folder)

```sh
# In the client-library folder
npm run build
npm link

cd /path/to/test/project
npm link @mizu-dev/hono
```

No need to install it in your other project, just write:

```ts
import { createHonoMiddleware } from "@mizu-dev/hono";
```

Then, once you are done testing locally, simply unlink the package

```sh
# check the link exists
npm ls -g --depth=0 --link=true
# remove the link
npm unlink @mizu-dev/hono -g
```


## `npm pack`

```sh
npm pack
cd /path/to/other/projenct
# Replace the version command with the tarball that was created
npm install /path/to/client-library/@mizu-dev-hono-x.y.z.tgz
```