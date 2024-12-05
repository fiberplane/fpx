import * as path from "node:path";
import { expect, test } from "vitest";
import { createRoutesMonitor } from "../setup";

test.each([
  {
    name: "single file",
    location: "../../test-cases/single",
    expectedErrorCount: 0,
  },
  {
    name: "multiple files",
    location: "../../test-cases/multiple",
    expectedErrorCount: 0,
  },
  {
    name: "module imports",
    location: "../../test-cases/module-imports",
    expectedErrorCount: 0,
  },
  {
    name: "barrel files",
    location: "../../test-cases/barrel-files",
    expectedErrorCount: 0,
  },
  // {
  //   name: "bindings",
  //   location: "../../test-cases/bindings",
  // },
  {
    name: "split routes",
    location: "../../test-cases/split-routes",
    expectedErrorCount: 0,
  },
  // {
  //   name: "empty",
  //   location: "../../test-cases/empty",
  // },
  {
    name: "hono factory",
    location: "../../test-cases/hono-factory",
    expectedErrorCount: 0,
  },
  {
    name: "import as",
    location: "../../test-cases/import-as",
    expectedErrorCount: 0,
  },
  {
    name: "zod-openapi",
    location: "../../test-cases/zod-openapi",
    // There are two typescript errors when analyzing the test-case
    // What's triggering them is `.openapi("SOMETHING")`
    // Typescript error is: `No symbol found for type`
    expectedErrorCount: 2,
  },

  // The projects below are larger projects which aren't
  // analyzed as changes to these those projects would
  // result in this test suite failing.
  // {
  //   name: "goose-quotes",
  //   location: "../../../../examples/goose-quotes",
  // },
  // {
  //   name: "api",
  //   location: "../../../../api",
  // },
])(
  "run test $name with location $location",
  async ({ location, name, expectedErrorCount }) => {
    // Get the exact location
    const absolutePath = path.join(__dirname, location);
    // Create a monitor for the routes
    const monitor = createRoutesMonitor(absolutePath);

    // Disable auto creation/updating of the route results
    // because we want to manually call findHonoRoutes
    monitor.autoCreateResult = false;
    try {
      // Start monitoring the filesystem
      await monitor.start();
      const start = performance.now();
      const result = monitor.findHonoRoutes();
      console.log(
        `Duration for ${name}: ${(performance.now() - start).toFixed(4)}`,
      );

      // Expect no errors
      expect(result.errorCount).toBe(expectedErrorCount);

      // Get all found resources
      const resources = result.resourceManager.getResources();

      // Compare to snapshot
      expect(resources).toMatchSnapshot();
    } finally {
      monitor.stop();
    }
  },
  {
    timeout: 100000,
  },
);
