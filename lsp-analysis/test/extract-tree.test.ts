import * as path from "node:path";
import { expect, test } from "vitest";
import { setupMonitoring } from "../src";
// import type { RouteTree, SourceReference } from "../src/types";

test.each([
  // {
  //   name: "single file",

  //   location: "./test-case/single",
  // },
  // {
  //   name: "multiple files",
  //   location: "./test-case/multiple",
  // },
  // {
  //   name: "module imports",
  //   location: "./test-case/module-imports",
  // },
  // {
  //   name: "barrel files",
  //   location: "./test-case/barrel-files",
  // },
  // // {
  // //   name: "bindings",
  // //   location: "./test-case/bindings",
  // // },
  // {
  //   name: "split routes",
  //   location: "./test-case/split-routes",
  // },
  // {
  //   name: "empty",
  //   location: "./test-case/empty",
  // },
  // {
  //   name: "goose-quotes",
  //   location: "../../examples/goose-quotes",
  // },
  {
    name: "hono factory",
    location: "./test-case/hono-factory",
  },
  // {
  //   name: "api",
  //   location: "../../api",
  // }
])("run test $name with location $location", async ({ location, name }) => {
  const absolutePath = path.join(__dirname, location);
  const { watcher, findHonoRoutes, teardown } = setupMonitoring(absolutePath);
  try {
    watcher.start();
    // findHonoRoutes();
    const start = performance.now();
    const result = findHonoRoutes();
    console.log(
      `Duration for ${name}: ${(performance.now() - start).toFixed(4)}`,
    );
    expect(result).toMatchSnapshot();
    // console.log(result.results[0].entries);
    // console.log(flattenRouteTree(result.results[0], "/api/geese/:id/generate"));
    // console.log(flattenRouteTree(result.results[0]));
    // flatten
  } finally {
    teardown();
  }
});

// function flattenRouteTree(routeTree: RouteTree, path?: string) {
//   type FileInfo = {
//     imports: Array<string>;
//     // TODO handle multiple things on a single line
//     content: Record<number, string>;
//   };
//   const newFileEntry = () => {
//     return {
//       imports: [],
//       content: {},
//     };
//   };

//   const files: Record<string, FileInfo> = {
//     [routeTree.fileName]: newFileEntry(),
//   };
//   const routes: Array<string> = [];

//   for (const entry of routeTree.entries) {
//     if (
//       (path && entry.path !== path) ||
//       entry.type === "ROUTE_TREE_REFERENCE"
//     ) {
//       console.log("Encountered unsupported route tree reference", entry);
//       continue;
//     }

//     if (entry.type === "MIDDLEWARE_ENTRY") {
//       console.log("Encountered unsupported middleware entry", entry);
//       continue;
//     }

//     routes.push(
//       `${routeTree.name}.${entry.method}("${entry.path}", ${entry.sources
//         .map((source) => source.content)
//         .join(",")})`,
//     );

//     for (const routeSources of entry.sources) {
//       const current = files[routeSources.fileName];

//       const imports = Object.keys(routeSources.modules)
//         .map((module) => {
//           return `import { ${routeSources.modules[module].map((importPath) => {
//             return importPath.import;
//           })} } from "${module}";`;
//         })
//         .join("\n");

//       if (imports) {
//         current.imports.push(imports);
//       }

//       routeSources.references.forEach(parseSource);
//     }
//   }

//   function parseSource(sourceReference: SourceReference) {
//     const { fileName, line, content } = sourceReference;
//     const file: FileInfo = files[fileName] || newFileEntry();
//     file.content[line] = content;
//     files[fileName] = file;
//     file.imports.push(
//       Object.keys(sourceReference.modules)
//         .map((module) => {
//           return `import { ${sourceReference.modules[module].map(
//             (importPath) => {
//               return importPath.import;
//             },
//           )} } from "${module}";`;
//         })
//         .join(", "),
//     );
//     sourceReference.references.forEach(parseSource);
//   }

//   function serializeFile(fileName: string) {
//     const file = files[fileName] || newFileEntry();
//     const lines = Object.keys(file.content)
//       .sort()
//       .map((line) => {
//         return `${file.content[line]}`;
//       });

//     return `// ${fileName}
// ${file.imports.join("\n")}

// ${lines.join("\n\n")}`;
//   }

//   return `${serializeFile(routeTree.fileName)}
// import { Hono } from "hono";

// const ${routeTree.name} = new Hono();

// ${routes.join("\n\n")}

// ${Object.keys(files)
//       .filter((file) => file !== routeTree.fileName)
//       .map((file) => serializeFile(file))
//       .join("\n\n")}
// `;
// }
