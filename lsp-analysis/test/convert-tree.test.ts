import { expect, test } from "vitest";
import { AppFactory } from "../src";
import type { RouteTree } from "../src/types";

test("simple tree", async () => {
  const trees: Array<RouteTree> = [
    {
      type: "ROUTE_TREE",
      baseUrl: "",
      id: "root",
      entries: [
        {
          type: "ROUTE_ENTRY",
          id: "home",
          method: "get",
          path: "/",
          sources: [],
        },
      ],
      fileName: "index.ts",
      name: "app",
    },
  ];

  const factory = new AppFactory(trees);
  const app = factory.getApp("root");
  expect(factory.getHistoryLength()).toBe(0);
  const request = new Request("http://localhost/", { method: "GET" });
  const response = await app.fetch(request);
  expect(await response.text()).toEqual("Ok");
  expect(factory.getHistoryLength()).toBe(2);
  expect(factory.hasVisited("root")).toBe(true);
  expect(factory.hasVisited("home")).toBe(true);
});

test("nested tree", async () => {
  const trees: Array<RouteTree> = [
    {
      type: "ROUTE_TREE",
      baseUrl: "",
      id: "root",
      entries: [
        {
          type: "ROUTE_TREE_REFERENCE",
          targetId: "nested",
          fileName: "nested.ts",
          name: "nested",
          path: "/",
        },
      ],
      fileName: "index.ts",
      name: "app",
    },
    {
      type: "ROUTE_TREE",
      baseUrl: "",
      id: "nested",
      entries: [
        {
          type: "ROUTE_ENTRY",
          id: "nested-home",
          method: "get",
          path: "/nested",
          sources: [],
        },
      ],
      fileName: "nested.ts",
      name: "nested",
    },
  ];

  const factory = new AppFactory(trees);
  const app = factory.getApp("root");
  expect(factory.getHistoryLength()).toBe(0);

  // Make request
  const request = new Request("http://localhost/nested", { method: "GET" });
  const response = await app.fetch(request);

  expect(await response.text()).toEqual("Ok");
  expect(factory.getHistoryLength()).toBe(3);
  expect(factory.hasVisited("root")).toBe(true);
  expect(factory.hasVisited("nested")).toBe(true);
  expect(factory.hasVisited("nested-home")).toBe(true);
});

test("nested tree", async () => {
  const trees: Array<RouteTree> = [
    {
      type: "ROUTE_TREE",
      baseUrl: "",
      id: "root",
      entries: [
        {
          type: "MIDDLEWARE_ENTRY",
          id: "all-middleware",
          path: "",
          sources: [],
        },
        {
          type: "ROUTE_ENTRY",
          id: "subpath",
          method: "get",
          path: "/subpath",
          sources: [],
        },
        {
          type: "MIDDLEWARE_ENTRY",
          id: "subpath-id-middleware",
          path: "/subpath/:id",
          sources: [],
        },
        {
          type: "ROUTE_ENTRY",
          id: "subpath-id",
          method: "get",
          path: "/subpath/:id",
          sources: [],
        },
      ],
      fileName: "index.ts",
      name: "app",
    },
  ];

  const factory = new AppFactory(trees);
  const app = factory.getApp("root");
  expect(factory.getHistoryLength()).toBe(0);

  // Make request
  let request = new Request("http://localhost/subpath", { method: "GET" });
  let response = await app.fetch(request);

  expect(await response.text()).toEqual("Ok");
  // The middleware should be called for all requests
  expect(factory.hasVisited("root")).toBe(true);
  expect(factory.hasVisited("subpath")).toBe(true);
  expect(factory.hasVisited("all-middleware")).toBe(true);
  // That's 3 in total
  expect(factory.getHistoryLength()).toBe(3);

  // Reset the history
  factory.resetHistory();

  // Make another request
  request = new Request("http://localhost/subpath/:id", { method: "GET" });
  response = await app.fetch(request);

  expect(await response.text()).toEqual("Ok");

  expect(factory.hasVisited("root")).toBe(true);
  expect(factory.hasVisited("subpath-id")).toBe(true);
  expect(factory.hasVisited("all-middleware")).toBe(true);
  expect(factory.hasVisited("subpath-id-middleware")).toBe(true);
  expect(factory.getHistoryLength()).toBe(4);
});
