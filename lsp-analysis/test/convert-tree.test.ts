import path from "node:path";
import { assert, expect, test } from "vitest";
import { AppFactory, analyze, setupMonitoring } from "../src";

test("hono-factory", async () => {
  const absolutePath = path.join(__dirname, "./test-case/hono-factory");
  const { watcher, findHonoRoutes, teardown } = setupMonitoring(absolutePath);
  try {
    watcher.start();
    const start = performance.now();
    const result = findHonoRoutes();
    console.log(
      `Duration for hono-factory: ${(performance.now() - start).toFixed(4)}`,
    );
    const { resourceManager } = result;
    const root = analyze(resourceManager.getResources());
    expect(root).not.toBeNull();
    assert(root !== null);
    const factory = new AppFactory(resourceManager);
    if (!root) {
      throw new Error("Root is null");
    }

    const app = factory.getApp(root.id);
    const request = new Request("http://localhost/", { method: "GET" });
    const response = await app.fetch(request);
    expect(await response.text()).toEqual("Ok");
    expect(factory.getHistoryLength()).toBe(3);

    const history = factory.getHistory();
    expect(factory.hasVisited(root.id)).toBeTruthy();
    // Expect the app from the factory file to be visited
    expect(
      history.find((item) => item.startsWith("ROUTE_TREE:factory.ts@")),
    ).toBeTruthy();
    expect(
      history.find((item) => item.startsWith("ROUTE_ENTRY:factory.ts@")),
    ).toBeTruthy();
    expect(factory.getFilesForHistory()).toMatchSnapshot();
  } finally {
    teardown();
  }
});

test("barrel-files", async () => {
  const absolutePath = path.join(__dirname, "./test-case/barrel-files");
  const { watcher, findHonoRoutes, teardown } = setupMonitoring(absolutePath);
  try {
    watcher.start();
    // findHonoRoutes();
    const start = performance.now();
    const result = findHonoRoutes();
    console.log(
      `Duration for barrel files: ${(performance.now() - start).toFixed(4)}`,
    );
    const root = analyze(result.resourceManager.getResources());
    expect(root).not.toBeNull();
    assert(root !== null);
    const factory = new AppFactory(result.resourceManager);
    if (!root) {
      throw new Error("Root is null");
    }

    const app = factory.getApp(root.id);
    const request = new Request("http://localhost/", { method: "GET" });
    const response = await app.fetch(request);
    expect(await response.text()).toEqual("Ok");
    expect(factory.getHistoryLength()).toBe(2);

    expect(factory.hasVisited(root.id)).toBeTruthy();
    // Expect the app from the factory file to be visited
    expect(factory.getFilesForHistory()).toMatchSnapshot();
  } finally {
    teardown();
  }
});
