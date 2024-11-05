import path from "node:path";
import { expect, test } from "vitest";
import { analyze, setupMonitoring } from "../src";

test("analyze hono-factory", async () => {
  const location = "./test-case/hono-factory";
  const absolutePath = path.join(__dirname, location);
  const { watcher, findHonoRoutes, teardown } = setupMonitoring(absolutePath);
  try {
    console.log("absolutePath", absolutePath);
    watcher.start();
    const result = findHonoRoutes();
    const { resourceManager } = result;
    const resources = resourceManager.getResources();
    const root = analyze(resources);
    expect(root).not.toBeNull();
    expect(root?.id).toEqual("ROUTE_TREE:index.ts@75");
  } finally {
    teardown();
  }
});
