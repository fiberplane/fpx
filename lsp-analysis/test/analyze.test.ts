import path from "node:path";
import { expect, test } from "vitest";
import { type RouteTree, analyze, setupMonitoring } from "../src";

test("single nested route", async () => {
  const trees: Array<RouteTree> = [
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
  ];
  const result = analyze(trees);
  expect(result).not.toBeNull();
  expect(result.id).toBe("root");
});

// test('test api', async () => {
//   const location = "../../api";
//   const absolutePath = path.join(__dirname, location);
//   const { watcher, findHonoRoutes, teardown } = setupMonitoring(absolutePath);
//   try {
//     watcher.start();
//     const result = findHonoRoutes();
//     const treeItems = result.results;
//     const node = treeItems.find((item) => item.id === 'src/index.node.ts@1428');
//     console.log(node)
//     const root = analyze(treeItems);
//     console.log('root', root);
//     expect(root).not.toBeNull();
//   } finally {
//     teardown();
//   }
// });
