import * as path from "node:path";
import { setupMonitoring } from "src";
import { expect, test } from "vitest";

test.skip("single file", async () => {
  const location = path.join(__dirname, "./test-case/single");
  const { watcher, findHonoRoutes, teardown } = setupMonitoring(location);
  try {
    watcher.start();

    expect(findHonoRoutes()).toMatchSnapshot();
  } finally {
    teardown();
  }
});

test.skip("multiple files", async () => {
  const location = path.join(__dirname, "./test-case/multiple");
  const { watcher, findHonoRoutes, teardown } = setupMonitoring(location);
  try {
    watcher.start();

    expect(findHonoRoutes()).toMatchSnapshot();
  } finally {
    teardown();
  }
});

test("module imports", async () => {
  const location = path.join(__dirname, "./test-case/module-imports");
  const { watcher, findHonoRoutes, teardown } = setupMonitoring(location);
  try {
    watcher.start();

    const result = findHonoRoutes();
    // console.log(JSON.stringify(result, null, 2))
    expect(result).toMatchSnapshot();
  } finally {
    teardown();
  }
});

test.skip("bindings", async () => {
  const location = path.join(__dirname, "./test-case/bindings");
  const { watcher, findHonoRoutes, teardown } = setupMonitoring(location);
  try {
    watcher.start();

    expect(findHonoRoutes()).toMatchSnapshot();
  } finally {
    teardown();
  }
});

// test.skip("goose quotes", async () => {
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

// test.skip("api", async () => {
//   // const location = path.resolve(path.join(__dirname, "../../api"));
//   const location = path.resolve(path.join(__dirname, "../../api"));
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
