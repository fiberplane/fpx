import * as path from "node:path";
import { expect, test } from "vitest";
import { setupMonitoring } from "..";

test.each([
  {
    name: "single file",

    location: "../../test-case/single",
  },
  {
    name: "multiple files",
    location: "../../test-case/multiple",
  },
  {
    name: "module imports",
    location: "../../test-case/module-imports",
  },
  {
    name: "barrel files",
    location: "../../test-case/barrel-files",
  },
  // {
  //   name: "bindings",
  //   location: "../../test-case/bindings",
  // },
  {
    name: "split routes",
    location: "../../test-case/split-routes",
  },
  {
    name: "empty",
    location: "../../test-case/empty",
  },
  // {
  //   name: "goose-quotes",
  //   location: "../../examples/goose-quotes",
  // },
  {
    name: "hono factory",
    location: "../../test-case/hono-factory",
  },
  // {
  //   name: "api",
  //   location: "../../api",
  // }
])("run test $name with location $location", async ({ location, name }) => {
  const absolutePath = path.join(__dirname, location);
  const { watcher, findHonoRoutes, teardown } = setupMonitoring(absolutePath);
  try {
    watcher.start();
    const start = performance.now();
    const result = findHonoRoutes();
    console.log(
      `Duration for ${name}: ${(performance.now() - start).toFixed(4)}`,
    );
    expect(result.errorCount).toBe(0);
    const resources = result.resourceManager.getResources();
    expect(resources).toMatchSnapshot();
  } finally {
    teardown();
  }
});
