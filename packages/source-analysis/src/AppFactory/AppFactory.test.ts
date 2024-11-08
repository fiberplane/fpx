import path from "node:path";
import { assert, expect, test } from "vitest";
import { AppFactory } from ".";
import { analyze } from "../analyze";
import { setupMonitoring } from "../setup";

test("hono-factory", async () => {
  const absolutePath = path.join(__dirname, "../../test-cases/hono-factory");
  const { watcher, findHonoRoutes, teardown } = setupMonitoring(absolutePath);
  try {
    await watcher.start();
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

    const app = factory.setRootTree(root.id);
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
  const absolutePath = path.join(__dirname, "../../test-cases/barrel-files");
  const { watcher, findHonoRoutes, teardown } = setupMonitoring(absolutePath);
  try {
    await watcher.start();
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

    const app = factory.setRootTree(root.id);
    let request = new Request("http://localhost/", { method: "GET" });
    let response = await app.fetch(request);
    expect(await response.text()).toEqual("Ok");
    expect(factory.getHistoryLength()).toBe(2);
    expect(factory.hasVisited(root.id)).toBeTruthy();
    expect(factory.getFilesForHistory()).toMatchSnapshot();
    // Reset the history
    factory.resetHistory();

    request = new Request("http://localhost/user/1", { method: "GET" });
    response = await app.fetch(request);
    expect(await response.text()).toEqual("Ok");
    expect(factory.getHistoryLength()).toBe(2);
    expect(factory.hasVisited(root.id)).toBeTruthy();
    expect(factory.getFilesForHistory()).toMatchSnapshot();
  } finally {
    teardown();
  }
});

test("import-as", async () => {
  const absolutePath = path.join(__dirname, "../../test-cases/import-as");
  const { watcher, findHonoRoutes, teardown } = setupMonitoring(absolutePath);
  try {
    await watcher.start();
    const start = performance.now();
    const result = findHonoRoutes();
    console.log(
      `Duration for import-as: ${(performance.now() - start).toFixed(4)}`,
    );
    const root = analyze(result.resourceManager.getResources());
    expect(root).not.toBeNull();
    assert(root !== null);
    const factory = new AppFactory(result.resourceManager);
    if (!root) {
      throw new Error("Root is null");
    }

    const app = factory.setRootTree(root.id);
    let request = new Request("http://localhost/user/1", { method: "GET" });
    let response = await app.fetch(request);
    expect(await response.text()).toEqual("Ok");
    expect(factory.getHistoryLength()).toBe(2);
    expect(factory.hasVisited(root.id)).toBeTruthy();
    expect(factory.getFilesForHistory()).toMatchSnapshot();

    // console.log("------------------------------------")
    // console.log(factory.getFilesForHistory());
    // console.log("------------------------------------")
    // Reset the history
    factory.resetHistory();

    request = new Request("http://localhost/user/1/profile", { method: "GET" });
    response = await app.fetch(request);
    expect(await response.text()).toEqual("Ok");
    expect(factory.getHistoryLength()).toBe(2);
    expect(factory.hasVisited(root.id)).toBeTruthy();
    expect(factory.getFilesForHistory()).toMatchSnapshot();
    // console.log("------------------------------------")
    // console.log(factory.getFilesForHistory());
    // console.log("------------------------------------")
  } finally {
    teardown();
  }
});

test("goose-quotes", async () => {
  const absolutePath = path.join(
    __dirname,
    "../../../../examples/goose-quotes",
  );
  const { watcher, findHonoRoutes, teardown } = setupMonitoring(absolutePath);
  try {
    await watcher.start();
    const start = performance.now();
    const result = findHonoRoutes();
    console.log(
      `Duration for goose-quotes files: ${(performance.now() - start).toFixed(4)}`,
    );
    const root = analyze(result.resourceManager.getResources());
    expect(root).not.toBeNull();
    assert(root !== null);
    const factory = new AppFactory(result.resourceManager);
    if (!root) {
      throw new Error("Root is null");
    }

    const app = factory.setRootTree(root.id);
    const request = new Request("http://localhost/", { method: "GET" });
    const response = await app.fetch(request);
    expect(await response.text()).toEqual("Ok");
    expect(factory.getHistoryLength()).toBe(2);
    expect(factory.hasVisited(root.id)).toBeTruthy();
    const content = factory.getFilesForHistory();
    console.log(content);
    expect(content).toMatchSnapshot();
  } finally {
    teardown();
  }
});

test("goosify", async () => {
  const absolutePath = path.join(__dirname, "../../../../examples/goosify");
  const { watcher, findHonoRoutes, teardown } = setupMonitoring(absolutePath);
  try {
    await watcher.start();
    const start = performance.now();
    const result = findHonoRoutes();
    console.log(
      `Duration for goosify files: ${(performance.now() - start).toFixed(4)}`,
    );
    const root = analyze(result.resourceManager.getResources());
    expect(root).not.toBeNull();
    assert(root !== null);
    const factory = new AppFactory(result.resourceManager);
    if (!root) {
      throw new Error("Root is null");
    }

    const app = factory.setRootTree(root.id);
    let request = new Request("http://localhost/api/geese", {
      method: "GET",
    });
    let response = await app.fetch(request);
    expect(await response.text()).toEqual("Ok");
    expect(factory.getHistoryLength()).toBe(2);
    expect(factory.hasVisited(root.id)).toBeTruthy();
    let content = factory.getFilesForHistory();
    console.log(content);
    expect(content).toMatchSnapshot();

    factory.resetHistory();
    request = new Request("http://localhost/api/Gans", {
      method: "GET",
    });
    response = await app.fetch(request);
    expect(await response.text()).toEqual("Ok");
    expect(factory.getHistoryLength()).toBe(2);
    expect(factory.hasVisited(root.id)).toBeTruthy();
    content = factory.getFilesForHistory();
    console.log(content);
    expect(content).toMatchSnapshot();
  } finally {
    teardown();
  }
});
