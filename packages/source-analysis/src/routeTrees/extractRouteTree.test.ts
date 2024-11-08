import * as path from "node:path";
import { expect, test } from "vitest";
import { setupMonitoring } from "..";

test.each([
  {
    name: "single file",
    location: "../../test-cases/single",
  },
  {
    name: "multiple files",
    location: "../../test-cases/multiple",
  },
  {
    name: "module imports",
    location: "../../test-cases/module-imports",
  },
  {
    name: "barrel files",
    location: "../../test-cases/barrel-files",
  },
  // {
  //   name: "bindings",
  //   location: "../../test-cases/bindings",
  // },
  {
    name: "split routes",
    location: "../../test-cases/split-routes",
  },
  // {
  //   name: "empty",
  //   location: "../../test-cases/empty",
  // },
  {
    name: "goose-quotes",
    location: "../../../../examples/goose-quotes",
  },
  {
    name: "hono factory",
    location: "../../test-cases/hono-factory",
  },
  {
    name: "import as",
    location: "../../test-cases/import-as",
  },
  // // {
  // //   name: "api",
  // //   location: "../../api",
  // // }
])("run test $name with location $location", async ({ location, name }) => {
  const absolutePath = path.join(__dirname, location);
  const { watcher, findHonoRoutes, teardown } = setupMonitoring(absolutePath);
  try {
    await watcher.start();
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
