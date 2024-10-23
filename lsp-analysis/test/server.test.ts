import * as path from "node:path";
import { setupMonitoring } from "../src";
import { describe, expect, test } from "vitest";

test.each([
  {
    name: "single file",
    location: path.join(__dirname, "./test-case/single"),
  },
  {
    name: "multiple files",
    location: path.join(__dirname, "./test-case/single"),
  },
  {
    name: "module imports",
    location: path.join(__dirname, "./test-case/module-imports"),
  },
  {
    name: "bindings",
    location: path.join(__dirname, "./test-case/bindings"),
  },
  {
    name: "goose-quotes",
    location: path.join(__dirname, "../../examples/goose-quotes"),
  },
  {
    name: "api",
    location: path.join(__dirname, "../../api"),
  }
])('run test $name with location $location', async ({ location }) => {
  const { watcher, findHonoRoutes, teardown } = setupMonitoring(location);
  try {
    watcher.start();
    await new Promise((resolve) => setTimeout(resolve, 100));
    const start = performance.now();
    const result = findHonoRoutes()
    console.log("Duration", (performance.now() - start).toFixed(4));
    expect(result).toMatchSnapshot();
  } finally {
    teardown();
  }

});
// test("single file", async () => {
//   const location = path.join(__dirname, "./test-case/single");
//   const { watcher, findHonoRoutes, teardown } = setupMonitoring(location);
//   try {
//     watcher.start();

//     expect(findHonoRoutes()).toMatchSnapshot();
//   } finally {
//     teardown();
//   }
// });

// test("multiple files", async () => {
//   const location = path.join(__dirname, "./test-case/multiple");
//   const { watcher, findHonoRoutes, teardown } = setupMonitoring(location);
//   try {
//     watcher.start();

//     expect(findHonoRoutes()).toMatchSnapshot();
//   } finally {
//     teardown();
//   }
// });

// test("module imports", async () => {
//   const location = path.join(__dirname, "./test-case/module-imports");
//   const { watcher, findHonoRoutes, teardown } = setupMonitoring(location);
//   try {
//     watcher.start();

//     const result = findHonoRoutes();
//     // console.log(JSON.stringify(result, null, 2))
//     expect(result).toMatchSnapshot();
//   } finally {
//     teardown();
//   }
// });

// test("bindings", async () => {
//   const location = path.join(__dirname, "./test-case/bindings");
//   const { watcher, findHonoRoutes, teardown } = setupMonitoring(location);
//   try {
//     watcher.start();

//     expect(findHonoRoutes()).toMatchSnapshot();
//   } finally {
//     teardown();
//   }
// });

// test("goose quotes", async () => {
//   // const location = path.resolve(path.join(__dirname, "../../api"));
//   const location = path.resolve(path.join(__dirname, "../../examples/goose-quotes"));
//   const { watcher, findHonoRoutes, teardown } = setupMonitoring(location);
//   try {
//     watcher.start();

//     const result = findHonoRoutes()
//     // console.log('result', JSON.stringify(result, null, 2))
//     expect(result).toMatchSnapshot()
//   } finally {
//     teardown();
//   }

// });

// test("api", async () => {
//   // const location = path.resolve(path.join(__dirname, "../../api"));
//   const location = path.resolve(path.join(__dirname, "../../api"));
//   const { watcher, findHonoRoutes, teardown } = setupMonitoring(location);
//   try {
//     watcher.start();

//     const start = performance.now();
//     const result = findHonoRoutes()
//     console.log('duration', performance.now() - start);
//     // console.log('result', JSON.stringify(result, null, 2))
//     expect(result).toMatchSnapshot()
//   } finally {
//     teardown();
//   }

// });
