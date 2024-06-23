// Used example Hono app to configure tests
// https://github.com/honojs/examples/blob/main/basic/package.json

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
  },
});
