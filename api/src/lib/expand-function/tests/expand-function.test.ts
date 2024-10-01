import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { expandFunction } from "../expand-function.js";

// Shim __filename and __dirname since we're using esm
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the path and analyze the 'src' directory
const projectRoot = path.resolve(
  __dirname,
  "../../../../../examples/test-static-analysis",
);

const srcPath = path.resolve(projectRoot, "src");

// Skip source map search for tests
// Typically, we want to also look for a handler defintion in the source map of compiled ts code,
// but this adds unnecessary time to the test suite and could introduce flakiness.
const SKIP_SOURCE_MAP_SEARCH = { skipSourceMap: true };

// A function in `<root>/app/src/index.ts` that has a constant identifier that is out of scope
const functionWithConstant = `(c) => {
  const auth = c.req.header("Authorization");
  if (auth && PASSPHRASES.includes(auth)) {
    return c.text("Hello Hono!");
  }
  return c.text("Unauthorized", 401);
}`.trim();

// A function in `<root>/app/src/index.ts` that has a helper function that is out of scope
const functionWithHelper = `(c) => {
  const shouldSayHello = helperFunction(c.req);
  return c.text(shouldSayHello ? "Hello Helper Function!" : "Helper Function");
}`.trim();

// A function in `<root>/app/src/index.ts` that has a helper function that is out of scope and in another file
const functionWithHelperInAnotherFile = `(c) => {
  const auth = getAuthHeader(c.req);
  if (auth && PASSPHRASES.includes(auth)) {
    return c.text("Hello Hono!");
  }
  return c.text("Unauthorized", 401);
}`.trim();

// A function in `<root>/app/src/index.ts` that has a helper function that is out of scope and in another file,
// and the helper function itself has a constant that is out of scope and defined in another file
const functionWithHelperWithConstant = `(c) => {
  const randomHeader = getRandomHeader(c.req);
  if (randomHeader) {
    return c.text("What a random header!");
  }
  return c.text("No random header", 422);
}`.trim();

// A function in `<root>/app/src/other-router.ts` that has a global web standard (like console)
// which we can use to test that we're not including global web standards as out of scope identifiers
const functionWithWebStandardGlobals = `(c) => {
  console.log("Other Router");
  const url = new URL(c.req.url);
  return c.text(\`Other Router: \${url}\`);
}`.trim();

// A function in `<root>/app/src/other-router.ts` that has a drizzle identifier that is out of scope
const functionWithDrizzle = `(c) => {
  const db = drizzle(c.env.DB);
  const stuff = await db.select().from(schema.stuff);
  return c.json(stuff);
}`.trim();

describe("expandFunction: testing on the test-static-analysis project", () => {
  describe("single file - app/src/index.ts", () => {
    it("should return the function location and definition of a constant identifier that is out of scope", async () => {
      const result = await expandFunction(
        projectRoot,
        functionWithConstant,
        SKIP_SOURCE_MAP_SEARCH,
      );

      expect(result).not.toBeNull();
      expect(result?.file).toBe(path.resolve(srcPath, "index.ts"));
      expect(result?.startLine).toBe(10);
      expect(result?.startColumn).toBe(19);
      expect(result?.endLine).toBe(16);
      expect(result?.endColumn).toBe(2);

      expect(result?.context?.[0]?.definition?.text).toBe(
        '["I am a cat", "I am a dog", "I am a bird"]',
      );
    });

    it("should return the function location and definition of a function identifier that is out of scope", async () => {
      const result = await expandFunction(
        projectRoot,
        functionWithHelper,
        SKIP_SOURCE_MAP_SEARCH,
      );

      expect(result).not.toBeNull();
      expect(result?.file).toBe(path.resolve(srcPath, "index.ts"));
      expect(result?.startLine).toBe(18);
      expect(result?.startColumn).toBe(29);
      expect(result?.endLine).toBe(21);
      expect(result?.endColumn).toBe(2);

      expect(result?.context?.[0]?.definition?.text).toBe(
        `function helperFunction(req: HonoRequest): boolean {
  return req.query("shouldSayHello") === "true";
}`.trim(),
      );
    });
  });

  describe("multiple files - app/src/index.ts, app/src/utils.ts, app/src/constants.ts", () => {
    it("should return the function location and definition of a function identifier that is out of scope", async () => {
      const result = await expandFunction(
        projectRoot,
        functionWithHelperInAnotherFile,
        SKIP_SOURCE_MAP_SEARCH,
      );

      expect(result).not.toBeNull();
      expect(result?.file).toBe(path.resolve(srcPath, "index.ts"));
      expect(result?.startLine).toBe(23);
      expect(result?.startColumn).toBe(42);
      expect(result?.endLine).toBe(29);
      expect(result?.endColumn).toBe(2);

      expect(result?.context).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            definition: expect.objectContaining({
              text: `export function getAuthHeader(req: HonoRequest) {
  return req.header("Authorization");
}`.trim(),
            }),
          }),
        ]),
      );
    });

    it("should recursively expand context for a function identifier that is out of scope", async () => {
      const result = await expandFunction(
        projectRoot,
        functionWithHelperWithConstant,
        SKIP_SOURCE_MAP_SEARCH,
      );

      expect(result).not.toBeNull();
      expect(result?.file).toBe(path.resolve(srcPath, "index.ts"));

      expect(result?.context).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            definition: expect.objectContaining({
              text: `export function getRandomHeader(req: HonoRequest) {
  return req.header(RANDOM_HEADER);
}`.trim(),
            }),
            context: expect.arrayContaining([
              expect.objectContaining({
                name: "RANDOM_HEADER",
                definition: expect.objectContaining({
                  text: `"X-Random"`,
                }),
              }),
            ]),
          }),
        ]),
      );
    });
  });

  describe("router file - app/src/other-router.ts", () => {
    it("should not return global web standards like console as out of scope identifiers", async () => {
      const result = await expandFunction(
        projectRoot,
        functionWithWebStandardGlobals,
        SKIP_SOURCE_MAP_SEARCH,
      );

      expect(result).not.toBeNull();
      expect(result?.file).toBe(path.resolve(srcPath, "other-router.ts"));
      expect(result?.startLine).toBe(11);
      expect(result?.startColumn).toBe(14);
      expect(result?.endLine).toBe(15);
      expect(result?.endColumn).toBe(2);

      // NOTE - `console` maps back to `@cloudflare/workers-types`'s declaration file (.d.ts)
      //         so our `expandFunction` correctly identifies it as part of the runtime
      expect(result?.context).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "console",
          }),
        ]),
      );

      // NOTE - `log` *SHOULD* map back to `@cloudflare/workers-types`'s declaration file (.d.ts)
      //         so our `expandFunction` *SHOULD* correctly identifies it as part of the runtime
      //         If this fails, though, you may need to uncomment the lines below, as depending on the workers-types,
      //         we might end up mapping `log` to an `index.ts` file.
      expect(result?.context).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "log",
          }),
        ]),
      );

      // HACK - `log` maps back to workers-types (cloudflare pacakge), but not a `.d.ts` file...
      //         so it's really difficult to detect that it's actually part of the runtime
      //         so we just check that we correctly identify the package name and move on for now
      // expect(result?.context).toEqual(
      //   expect.arrayContaining([
      //     expect.objectContaining({
      //       name: "log",
      //       package: expect.stringMatching(/^@cloudflare\/workers-types/),
      //     }),
      //   ]),
      // );
    });
  });

  describe("drizzle test (external packages)", () => {
    it("should report drizzle as an out of scope identifier and show its package name", async () => {
      const result = await expandFunction(
        projectRoot,
        functionWithDrizzle,
        SKIP_SOURCE_MAP_SEARCH,
      );

      expect(result).not.toBeNull();
      expect(result?.file).toBe(path.resolve(srcPath, "other-router.ts"));
      expect(result?.startLine).toBe(17);
      // Start column is 16 because of the `async` keyword at the beginning of the function
      expect(result?.startColumn).toBe(16);
      expect(result?.endLine).toBe(21);
      expect(result?.endColumn).toBe(2);

      expect(result?.context).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "drizzle",
            package: expect.stringMatching(/^drizzle-orm/),
          }),
        ]),
      );
    });

    it("should handle expansion of schema definition (drizzle schema)", async () => {
      const result = await expandFunction(
        projectRoot,
        functionWithDrizzle,
        SKIP_SOURCE_MAP_SEARCH,
      );

      expect(result).not.toBeNull();

      expect(result?.context).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "stuff",
            definition: expect.objectContaining({
              text: `sqliteTable("stuff", {
  id: integer("id", { mode: "number" }).primaryKey(),
  foo: text(\"foo\").notNull(),
  createdAt: text("created_at").notNull().default(sql\`(CURRENT_TIMESTAMP)\`),
  updatedAt: text("updated_at").notNull().default(sql\`(CURRENT_TIMESTAMP)\`),
})`.trim(),
            }),
            // TODO - Follow definition of sqliteTable and sql
            // context: expect.arrayContaining([
            //   expect.objectContaining({
            //     name: "sqliteTable",
            //     definition: expect.objectContaining({
            //       text: "TODO",
            //       package: expect.stringMatching(/^drizzle-orm/),
            //     }),
            //   }),
            // ]),
          }),
        ]),
      );
    });
  });
});
