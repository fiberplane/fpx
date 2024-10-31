import { assert, expect, test } from "vitest";
import { analyze, AppFactory, setupMonitoring } from "../src";
import path from "node:path";
import { RouteEntryId, RouteTree, RouteTreeId, RouteTreeReferenceId, SourceReferenceId, TreeResource } from "../src/types";
// import type { RouteTree } from "../src/types";

// test.skip("simple tree", async () => {
//   const trees: Array<RouteTree> = [
//     {
//       type: "ROUTE_TREE",
//       baseUrl: "",
//       id: "root",
//       entries: [
//         {
//           type: "ROUTE_ENTRY",
//           id: "home",
//           method: "get",
//           path: "/",
//           sources: [],
//         },
//       ],
//       fileName: "index.ts",
//       name: "app",
//     },
//   ];

//   const factory = new AppFactory(trees);
//   const app = factory.getApp("root");
//   expect(factory.getHistoryLength()).toBe(0);
//   const request = new Request("http://localhost/", { method: "GET" });
//   const response = await app.fetch(request);
//   expect(await response.text()).toEqual("Ok");
//   expect(factory.getHistoryLength()).toBe(2);
//   expect(factory.hasVisited("root")).toBe(true);
//   expect(factory.hasVisited("home")).toBe(true);
// });

// test.skip("nested tree", async () => {
//   const trees: Array<RouteTree> = [
//     {
//       type: "ROUTE_TREE",
//       baseUrl: "",
//       id: "root",
//       entries: [
//         {
//           type: "ROUTE_TREE_REFERENCE",
//           targetId: "nested",
//           fileName: "nested.ts",
//           name: "nested",
//           path: "/",
//         },
//       ],
//       fileName: "index.ts",
//       name: "app",
//     },
//     {
//       type: "ROUTE_TREE",
//       baseUrl: "",
//       id: "nested",
//       entries: [
//         {
//           type: "ROUTE_ENTRY",
//           id: "nested-home",
//           method: "get",
//           path: "/nested",
//           sources: [],
//         },
//       ],
//       fileName: "nested.ts",
//       name: "nested",
//     },
//   ];

//   const factory = new AppFactory(trees);
//   const app = factory.getApp("root");
//   expect(factory.getHistoryLength()).toBe(0);

//   // Make request
//   const request = new Request("http://localhost/nested", { method: "GET" });
//   const response = await app.fetch(request);

//   expect(await response.text()).toEqual("Ok");
//   expect(factory.getHistoryLength()).toBe(3);
//   expect(factory.hasVisited("root")).toBe(true);
//   expect(factory.hasVisited("nested")).toBe(true);
//   expect(factory.hasVisited("nested-home")).toBe(true);
// });

// test.skip("nested tree", async () => {
//   const trees: Array<RouteTree> = [
//     {
//       type: "ROUTE_TREE",
//       baseUrl: "",
//       id: "root",
//       entries: [
//         {
//           type: "MIDDLEWARE_ENTRY",
//           id: "all-middleware",
//           path: "",
//           sources: [],
//         },
//         {
//           type: "ROUTE_ENTRY",
//           id: "subpath",
//           method: "get",
//           path: "/subpath",
//           sources: [],
//         },
//         {
//           type: "MIDDLEWARE_ENTRY",
//           id: "subpath-id-middleware",
//           path: "/subpath/:id",
//           sources: [],
//         },
//         {
//           type: "ROUTE_ENTRY",
//           id: "subpath-id",
//           method: "get",
//           path: "/subpath/:id",
//           sources: [],
//         },
//       ],
//       fileName: "index.ts",
//       name: "app",
//     },
//   ];

//   const factory = new AppFactory(trees);
//   const app = factory.getApp("root");
//   expect(factory.getHistoryLength()).toBe(0);

//   // Make request
//   let request = new Request("http://localhost/subpath", { method: "GET" });
//   let response = await app.fetch(request);

//   expect(await response.text()).toEqual("Ok");
//   // The middleware should be called for all requests
//   expect(factory.hasVisited("root")).toBe(true);
//   expect(factory.hasVisited("subpath")).toBe(true);
//   expect(factory.hasVisited("all-middleware")).toBe(true);
//   // That's 3 in total
//   expect(factory.getHistoryLength()).toBe(3);

//   // Reset the history
//   factory.resetHistory();

//   // Make another request
//   request = new Request("http://localhost/subpath/:id", { method: "GET" });
//   response = await app.fetch(request);

//   expect(await response.text()).toEqual("Ok");

//   expect(factory.hasVisited("root")).toBe(true);
//   expect(factory.hasVisited("subpath-id")).toBe(true);
//   expect(factory.hasVisited("all-middleware")).toBe(true);
//   expect(factory.hasVisited("subpath-id-middleware")).toBe(true);
//   expect(factory.getHistoryLength()).toBe(4);
// });
test("hono-factory", () => {
  //   const resources: Record<TreeResource["id"], TreeResource> = {
  //     [("ROUTE_TREE:bye.ts@36" as RouteTreeId)]: {
  //       "id": ("ROUTE_TREE:bye.ts@36" as RouteTreeId),
  //       "type": "ROUTE_TREE",
  //       "baseUrl": "",
  //       "name": "bye",
  //       "fileName": "bye.ts",
  //       "position": 36,
  //       "entries": [
  //         ("ROUTE_ENTRY:bye.ts@54" as RouteEntryId)
  //       ]
  //     },
  //     [("ROUTE_ENTRY:bye.ts@54" as RouteEntryId)]: {
  //       "id": ("ROUTE_ENTRY:bye.ts@54" as RouteEntryId),
  //       "type": "ROUTE_ENTRY",
  //       "fileName": "bye.ts",
  //       "position": 54,
  //       "method": "get",
  //       "path": "/bye",
  //       "modules": [],
  //       "sources": [
  //         ("SOURCE_REFERENCE:bye.ts@70" as SourceReferenceId)"
  //       ]
  //     },
  //     [("SOURCE_REFERENCE:bye.ts@70" as SourceReferenceId)]: {
  //       "id": ("SOURCE_REFERENCE:bye.ts@70" as SourceReferenceId),
  //       "type": "SOURCE_REFERENCE",
  //       "character": 16,
  //       "line": 3,
  //       "fileName": "bye.ts",
  //       "position": 70,
  //       "content": "(c) => c.text(\"Bye, sub!\")",
  //       "references": [],
  //       "modules": []
  //     },
  //     [("ROUTE_TREE:panic.ts@36" as RouteTreeId)]: {
  //       "id": ("ROUTE_TREE:panic.ts@36" as RouteTreeId),
  //       "type": "ROUTE_TREE",
  //       "baseUrl": "",
  //       "name": "app",
  //       "fileName": "panic.ts",
  //       "position": 36,
  //       "entries": [
  //         [("ROUTE_ENTRY:panic.ts@54" as RouteEntryId)]
  //       ]
  //     },
  //     [("ROUTE_ENTRY:panic.ts@54" as RouteEntryId)]: {
  //       "id": [("ROUTE_ENTRY:panic.ts@54" as RouteEntryId)],
  //       "type": "ROUTE_ENTRY",
  //       "fileName": "panic.ts",
  //       "position": 54,
  //       "method": "get",
  //       "path": "/",
  //       "modules": [],
  //       "sources": [
  //         ("SOURCE_REFERENCE:panic.ts@67" as SourceReferenceId)
  //       ]
  //     },
  //     [("SOURCE_REFERENCE:panic.ts@67" as SourceReferenceId)]: {
  //       "id": ("SOURCE_REFERENCE:panic.ts@67" as SourceReferenceId),
  //       "type": "SOURCE_REFERENCE",
  //       "character": 13,
  //       "line": 3,
  //       "fileName": "panic.ts",
  //       "position": 67,
  //       "content": "(c) => {\n  c.status(500);\n  return c.text(\"Panic!\");\n}",
  //       "references": [],
  //       "modules": []
  //     },
  //     [("ROUTE_TREE:silence.ts@36" as RouteTreeId)]: {
  //       "id": "ROUTE_TREE:silence.ts@36",
  //       "type": "ROUTE_TREE",
  //       "baseUrl": "",
  //       "name": "silence",
  //       "fileName": "silence.ts",
  //       "position": 36,
  //       "entries": [
  //         [("ROUTE_ENTRY:silence.ts@58" as RouteEntryId)]
  //       ]
  //     },
  //     [("ROUTE_ENTRY:silence.ts@58" as RouteEntryId)]: {
  //       "id": [("ROUTE_ENTRY:silence.ts@58" as RouteEntryId)],
  //       "type": "ROUTE_ENTRY",
  //       "fileName": "silence.ts",
  //       "position": 58,
  //       "method": "get",
  //       "path": "/",
  //       "modules": [],
  //       "sources": [
  //         ("SOURCE_REFERENCE:silence.ts@75" as SourceReferenceId)
  //       ]
  //     },
  //     [("SOURCE_REFERENCE:silence.ts@75" as SourceReferenceId)]: {
  //       "id": ("SOURCE_REFERENCE:silence.ts@75" as SourceReferenceId),
  //       "type": "SOURCE_REFERENCE",
  //       "character": 17,
  //       "line": 3,
  //       "fileName": "silence.ts",
  //       "position": 75,
  //       "content": "(c) => c.text(\"...\")",
  //       "references": [],
  //       "modules": []
  //     },
  //     [("ROUTE_TREE:index.ts@75" as RouteTreeId)]: {
  //       "id": ("ROUTE_TREE:index.ts@75" as RouteTreeId),
  //       "type": "ROUTE_TREE",
  //       "baseUrl": "",
  //       "name": "app",
  //       "fileName": "index.ts",
  //       "position": 75,
  //       "entries": [
  //         ("ROUTE_TREE_REFERENCE:factory.ts@248" as RouteTreeReferenceId),
  //         ("ROUTE_TREE_REFERENCE:index.ts@101" as RouteTreeReferenceId)
  //       ]
  //     },
  //     [("ROUTE_TREE:factory.ts@248" as RouteTreeId)]: {
  //       "id": ("ROUTE_TREE:factory.ts@248" as RouteTreeId),
  //       "type": "ROUTE_TREE",
  //       "baseUrl": "",
  //       "name": "app",
  //       "fileName": "factory.ts",
  //       "position": 248,
  //       "entries": [
  //         [("ROUTE_ENTRY:factory.ts@281" as RouteEntryId)],
  //         ("ROUTE_TREE_REFERENCE:bye.ts@36" as RouteTreeReferenceId),
  //         ("ROUTE_TREE_REFERENCE:silence.ts@36" as RouteTreeReferenceId),
  //         ("ROUTE_TREE_REFERENCE:panic.ts@36" as RouteTreeReferenceId)
  //       ]
  //     },
  //     [("ROUTE_ENTRY:factory.ts@281" as RouteEntryId)]: {
  //       "id": [("ROUTE_ENTRY:factory.ts@281" as RouteEntryId)],
  //       "type": "ROUTE_ENTRY",
  //       "fileName": "factory.ts",
  //       "position": 281,
  //       "method": "get",
  //       "path": "/",
  //       "modules": [],
  //       "sources": [
  //         ("SOURCE_REFERENCE:factory.ts@294" as SourceReferenceId)
  //       ]
  //     },
  //     [("SOURCE_REFERENCE:factory.ts@294" as SourceReferenceId)]: {
  //       "id": ("SOURCE_REFERENCE:factory.ts@294" as SourceReferenceId),
  //       "type": "SOURCE_REFERENCE",
  //       "character": 15,
  //       "line": 9,
  //       "fileName": "factory.ts",
  //       "position": 294,
  //       "content": "(c) => c.text(\"Hello, Hono!\")",
  //       "references": [],
  //       "modules": []
  //     },
  //     [("ROUTE_TREE_REFERENCE:bye.ts@36" as RouteTreeReferenceId)]: {
  //       "id": ("ROUTE_TREE_REFERENCE:bye.ts@36" as RouteTreeReferenceId),
  //       "type": "ROUTE_TREE_REFERENCE",
  //       "targetId": "ROUTE_TREE:bye.ts@36",
  //       "fileName": "bye.ts",
  //       "position": 36,
  //       "name": "bye",
  //       "path": "/bye"
  //     },
  //     [("ROUTE_TREE_REFERENCE:silence.ts@36" as RouteTreeReferenceId)]: {
  //       "id": ("ROUTE_TREE_REFERENCE:silence.ts@36" as RouteTreeReferenceId),
  //       "type": "ROUTE_TREE_REFERENCE",
  //       "targetId": "ROUTE_TREE:silence.ts@36",
  //       "fileName": "silence.ts",
  //       "position": 36,
  //       "name": "silence",
  //       "path": "/silence"
  //     },
  //     [("ROUTE_TREE_REFERENCE:panic.ts@36" as RouteTreeReferenceId)]: {
  //       "id": ("ROUTE_TREE_REFERENCE:panic.ts@36" as RouteTreeReferenceId),
  //       "type": "ROUTE_TREE_REFERENCE",
  //       "targetId": ("ROUTE_TREE:panic.ts@36" as RouteTreeId),
  //       "fileName": "panic.ts",
  //       "position": 36,
  //       "name": "app",
  //       "path": "/panic"
  //     },
  //     [("ROUTE_TREE_REFERENCE:factory.ts@248" as RouteTreeReferenceId)]: {
  //       "id": ("ROUTE_TREE_REFERENCE:factory.ts@248" as RouteTreeReferenceId),
  //       "type": "ROUTE_TREE_REFERENCE",
  //       "targetId": ("ROUTE_TREE:factory.ts@248" as RouteTreeId),
  //       "fileName": "factory.ts",
  //       "position": 248,
  //       "name": "app",
  //       "path": "/"
  //     },
  //     [("ROUTE_TREE_REFERENCE:index.ts@101" as RouteTreeReferenceId)]: {
  //       "id": ("ROUTE_TREE_REFERENCE:index.ts@101" as RouteTreeReferenceId),
  //       "type": "ROUTE_TREE_REFERENCE",
  //       "targetId": ("ROUTE_TREE:index.ts@101" as RouteTreeId),
  //       "fileName": "index.ts",
  //       "position": 101,
  //       "name": "subHello",
  //       "path": "/sub"
  //     },
  //     [("ROUTE_TREE:index.ts@101" as RouteTreeId)]: {
  //       "id": ("ROUTE_TREE:index.ts@101" as RouteTreeId),
  //       "type": "ROUTE_TREE",
  //       "baseUrl": "",
  //       "name": "subHello",
  //       "fileName": "index.ts",
  //       "position": 101,
  //       "entries": [
  //         [("ROUTE_ENTRY:index.ts@124" as RouteEntryId)],
  //         [("ROUTE_ENTRY:index.ts@173" as RouteEntryId)]
  //       ]
  //     },
  //     [("ROUTE_ENTRY:index.ts@124" as RouteEntryId)]: {
  //       "id": [("ROUTE_ENTRY:index.ts@124" as RouteEntryId)],
  //       "type": "ROUTE_ENTRY",
  //       "fileName": "index.ts",
  //       "position": 124,
  //       "method": "get",
  //       "path": "/",
  //       "modules": [],
  //       "sources": [
  //         ("SOURCE_REFERENCE:index.ts@142" as SourceReferenceId)
  //       ]
  //     },
  //     [("SOURCE_REFERENCE:index.ts@142": as SourceReferenceId)]: {
  //   "id": ("SOURCE_REFERENCE:index.ts@142" as SourceReferenceId),
  //     "type": "SOURCE_REFERENCE",
  //       "character": 18,
  //         "line": 6,
  //           "fileName": "index.ts",
  //             "position": 142,
  //               "content": "(c) => c.text(\"Hello, sub!\")",
  //                 "references": [],
  //                   "modules": []
  // },
  // [("ROUTE_ENTRY:index.ts@173" as RouteEntryId)]: {
  //   "id": [("ROUTE_ENTRY:index.ts@173" as RouteEntryId)],
  //     "type": "ROUTE_ENTRY",
  //       "fileName": "index.ts",
  //         "position": 173,
  //           "method": "get",
  //             "path": "/bye",
  //               "modules": [],
  //                 "sources": [
  //                   ("SOURCE_REFERENCE:index.ts@194" as SourceReferenceId)
  //                 ]
  // },
  // [("SOURCE_REFERENCE:index.ts@194" as SourceReferenceId)]: {
  //   "id": ("SOURCE_REFERENCE:index.ts@194" as SourceReferenceId),
  //     "type": "SOURCE_REFERENCE",
  //       "character": 21,
  //         "line": 7,
  //           "fileName": "index.ts",
  //             "position": 194,
  //               "content": "(c) => c.text(\"Bye, sub!\")",
  //                 "references": [],
  //                   "modules": []
  // }
  //   }
  const absolutePath = path.join(__dirname, "./test-case/hono-factory");
  const { watcher, findHonoRoutes, teardown } = setupMonitoring(absolutePath);
  try {
    watcher.start();
    // findHonoRoutes();
    const start = performance.now();
    const result = findHonoRoutes();
    console.log(
      `Duration for hono-factory: ${(performance.now() - start).toFixed(4)}`,
    );
    const root = analyze(result.resources);
    expect(root).not.toBeNull();
    assert(root !== null);
    const factory = new AppFactory(result.resources);
    const app = factory.getApp(root.id);

    //   console.log(JSON.stringify(result.resources, null, 2));
    //   // expect(result).toMatchSnapshot();
    //   // console.log(result.results[0].entries);
    //   // console.log(flattenRouteTree(result.results[0], "/api/geese/:id/generate"));
    //   // console.log(flattenRouteTree(result.results[0]));
    //   // flatten
  } finally {
    teardown();
  }

});
