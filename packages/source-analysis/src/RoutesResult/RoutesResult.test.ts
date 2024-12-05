import path from "node:path";
import { assert, expect, test } from "vitest";
import { createRoutesMonitor } from "../setup";

test("hono-factory", async () => {
  const absolutePath = path.join(__dirname, "../../test-cases/hono-factory");
  const monitor = createRoutesMonitor(absolutePath);
  monitor.autoCreateResult = false;
  try {
    await monitor.start();
    const factory = monitor.updateRoutesResult();
    assert(factory.rootId);

    const request = new Request("http://localhost/", { method: "GET" });
    const response = await factory.currentApp.fetch(request);
    expect(await response.text()).toEqual("Ok");
    expect(factory.getHistoryLength()).toBe(3);

    const history = factory.getHistory();
    expect(factory.hasVisited(factory.rootId)).toBeTruthy();

    // Expect the app from the factory file to be visited
    expect(
      history.find((item) => item.startsWith("ROUTE_TREE:factory.ts@")),
    ).toBeTruthy();
    expect(
      history.find((item) => item.startsWith("ROUTE_ENTRY:factory.ts@")),
    ).toBeTruthy();
    expect(factory.getFilesForHistory()).toMatchSnapshot();
  } finally {
    monitor.stop();
  }
});

test("barrel-files", async () => {
  const absolutePath = path.join(__dirname, "../../test-cases/barrel-files");
  const monitor = createRoutesMonitor(absolutePath);
  monitor.autoCreateResult = false;
  try {
    await monitor.start();
    const factory = monitor.updateRoutesResult();
    assert(factory.rootId);

    let request = new Request("http://localhost/", { method: "GET" });
    let response = await factory.currentApp.fetch(request);
    expect(await response.text()).toEqual("Ok");
    expect(factory.getHistoryLength()).toBe(2);
    expect(factory.hasVisited(factory.rootId)).toBeTruthy();
    expect(factory.getFilesForHistory()).toMatchSnapshot();
    // Reset the history
    factory.resetHistory();

    request = new Request("http://localhost/user/1", { method: "GET" });
    response = await factory.currentApp.fetch(request);
    expect(await response.text()).toEqual("Ok");
    expect(factory.getHistoryLength()).toBe(2);
    expect(factory.hasVisited(factory.rootId)).toBeTruthy();
    expect(factory.getFilesForHistory()).toMatchSnapshot();
  } finally {
    monitor.stop();
  }
});

test("import-as", async () => {
  const absolutePath = path.join(__dirname, "../../test-cases/import-as");
  const monitor = createRoutesMonitor(absolutePath);
  monitor.autoCreateResult = false;
  try {
    await monitor.start();
    const factory = monitor.updateRoutesResult();
    assert(factory.rootId);

    let request = new Request("http://localhost/user/1", { method: "GET" });
    let response = await factory.currentApp.fetch(request);
    expect(await response.text()).toEqual("Ok");
    expect(factory.getHistoryLength()).toBe(2);
    expect(factory.hasVisited(factory.rootId)).toBeTruthy();
    expect(factory.getFilesForHistory()).toMatchSnapshot();

    factory.resetHistory();
    request = new Request("http://localhost/user/1/profile", { method: "GET" });
    response = await factory.currentApp.fetch(request);
    expect(await response.text()).toEqual("Ok");
    expect(factory.getHistoryLength()).toBe(2);
    expect(factory.hasVisited(factory.rootId)).toBeTruthy();
    expect(factory.getFilesForHistory()).toMatchSnapshot();
  } finally {
    monitor.stop();
  }
});

test("multiple", async () => {
  const absolutePath = path.join(__dirname, "../../test-cases/multiple");
  const monitor = createRoutesMonitor(absolutePath);
  monitor.autoCreateResult = false;
  try {
    await monitor.start();
    const factory = monitor.updateRoutesResult();
    assert(factory.rootId);

    let request = new Request("http://localhost/", { method: "GET" });
    let response = await factory.currentApp.fetch(request);
    expect(await response.text()).toEqual("Ok");
    expect(factory.getHistoryLength()).toBe(2);
    expect(factory.hasVisited(factory.rootId)).toBeTruthy();
    expect(factory.getFilesForHistory()).toMatchSnapshot();

    factory.resetHistory();
    // Try to visit a route that doesn't exist
    request = new Request("http://localhost/hello-world", { method: "GET" });
    response = await factory.currentApp.fetch(request);
    expect(response.status).toEqual(404);
    expect(factory.getHistoryLength()).toBe(1);
    expect(factory.hasVisited(factory.rootId)).toBeTruthy();
    expect(factory.getFilesForHistory()).toMatchSnapshot();

    factory.resetHistory();
    // Try to visit a route that doesn't exist
    request = new Request("http://localhost/hello-world", { method: "POST" });
    response = await factory.currentApp.fetch(request);
    expect(await response.text()).toEqual("Ok");
    expect(factory.getHistoryLength()).toBe(2);
    expect(factory.hasVisited(factory.rootId)).toBeTruthy();
    expect(factory.getFilesForHistory()).toMatchSnapshot();
  } finally {
    monitor.stop();
  }
});

test("zod-openapi", async () => {
  const absolutePath = path.join(__dirname, "../../test-cases/zod-openapi");
  const monitor = createRoutesMonitor(absolutePath);
  monitor.autoCreateResult = false;
  try {
    await monitor.start();
    const factory = monitor.updateRoutesResult();
    assert(factory.rootId);

    let request = new Request("http://localhost/users", { method: "POST" });
    let response = await factory.currentApp.fetch(request);
    expect(await response.text()).toEqual("Ok");
    expect(factory.getHistoryLength()).toBe(2);
    expect(factory.hasVisited(factory.rootId)).toBeTruthy();
    expect(factory.getFilesForHistory()).toMatchSnapshot();

    factory.resetHistory();
    // Try to visit another route
    request = new Request("http://localhost/users", { method: "GET" });
    response = await factory.currentApp.fetch(request);
    expect(await response.text()).toEqual("Ok");
    expect(factory.getHistoryLength()).toBe(2);
    expect(factory.hasVisited(factory.rootId)).toBeTruthy();
    expect(factory.getFilesForHistory()).toMatchSnapshot();

  } finally {
    monitor.stop();
  }
});
