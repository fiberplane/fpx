To test the middleware package locally, you can use either `npm pack` or `npm link`.

## `npm pack`

> **TODO**

## `npm link`

- Link the package after you build it
- No need to install it in your other project, just `import { ... } from "@mizu-dev/hono";`
- TODO - Unlink

```sh
# In the client-library folder
npm run build
npm link

cd /path/to/test/project
npm link @mizu-dev/hono
```