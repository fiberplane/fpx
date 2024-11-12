import path from "node:path";
import { expect, test } from "vitest";
import { analyze } from "./analyze";
import { createRoutesMonitor } from "./setup";

test("analyze hono-factory", async () => {
  const location = "../test-cases/hono-factory";
  const absolutePath = path.join(__dirname, location);
  const monitor = createRoutesMonitor(absolutePath);
  monitor.autoCreateResult = false;
  try {
    await monitor.start();

    // Manually get the route resources
    const result = monitor.findHonoRoutes();
    const { resourceManager } = result;
    const resources = resourceManager.getResources();
    const root = analyze(resources);
    expect(root).not.toBeNull();
    expect(root?.id).toEqual("ROUTE_TREE:index.ts@75");
  } finally {
    monitor.teardown();
  }
});

test("analyze multiple", async () => {
  const location = "../test-cases/multiple";
  const absolutePath = path.join(__dirname, location);
  const monitor = createRoutesMonitor(absolutePath);
  monitor.autoCreateResult = false;
  try {
    await monitor.start();

    // Manually get the route resources
    const result = monitor.findHonoRoutes();
    const { resourceManager } = result;
    const resources = resourceManager.getResources();
    const root = analyze(resources);
    expect(root).not.toBeNull();
    expect(root?.id).toEqual("ROUTE_TREE:other.ts@35");
  } finally {
    monitor.teardown();
  }
});
