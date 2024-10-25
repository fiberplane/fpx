import * as path from "node:path";
import { expect, test } from "vitest";
import { setupMonitoring } from "../src";

test.each([
  {
    name: "single file",
    location: path.join(__dirname, "./test-case/single"),
  },
  {
    name: "multiple files",
    location: path.join(__dirname, "./test-case/multiple"),
  },
  {
    name: "module imports",
    location: path.join(__dirname, "./test-case/module-imports"),
  },
  {
    name: "barrel files",
    location: path.join(__dirname, "./test-case/barrel-files"),
  },
  // {
  //   name: "bindings",
  //   location: path.join(__dirname, "./test-case/bindings"),
  // },
  // {
  //   name: "goose-quotes",
  //   location: path.join(__dirname, "../../examples/goose-quotes"),
  // },
  // {
  //   name: "api",
  //   location: path.join(__dirname, "../../api"),
  // }
])("run test $name with location $location", async ({ location, name }) => {
  const { watcher, findHonoRoutes, teardown } = setupMonitoring(location);
  try {
    watcher.start();
    await new Promise((resolve) => setTimeout(resolve, 100));
    const start = performance.now();
    const result = findHonoRoutes();
    console.log(
      `Duration for ${name}: ${(performance.now() - start).toFixed(4)}`,
    );
    expect(result).toMatchSnapshot();
  } finally {
    teardown();
  }
});
