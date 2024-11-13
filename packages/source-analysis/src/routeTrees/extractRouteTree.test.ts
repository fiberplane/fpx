import * as path from "node:path";
import { expect, test } from "vitest";
import { createRoutesMonitor } from "../setup";

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
    name: "hono factory",
    location: "../../test-cases/hono-factory",
  },
  {
    name: "import as",
    location: "../../test-cases/import-as",
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
  async ({ location, name }) => {
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
      expect(result.errorCount).toBe(0);

      // Get all found resources
      const resources = result.resourceManager.getResources();

      // Compare to snapshot
      expect(resources).toMatchSnapshot();
    } finally {
      monitor.teardown();
    }
  },
  {
    timeout: 100000,
  },
);
