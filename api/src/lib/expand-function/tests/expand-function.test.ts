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
const srcPath = path.join(projectRoot, "src");

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

const functionWithWebStandardGlobals = `(c) => {
  console.log("Other Router");
  const url = new URL(c.req.url);
  return c.text(\`Other Router: \${url}\`);
}`.trim();

describe("expandFunction", () => {
  describe("single file - app/src/index.ts", () => {
    it("should return the function location and definition of a constant identifier that is out of scope", async () => {
      const result = await expandFunction(
        projectRoot,
        srcPath,
        functionWithConstant,
      );

      expect(result).not.toBeNull();
      expect(result?.file).toBe(path.resolve(srcPath, "index.ts"));
      expect(result?.startLine).toBe(9);
      expect(result?.startColumn).toBe(19);
      expect(result?.endLine).toBe(15);
      expect(result?.endColumn).toBe(2);

      expect(result?.context?.[0]?.definition?.text).toBe(
        '["I am a cat", "I am a dog", "I am a bird"]',
      );
    });

    it("should return the function location and definition of a function identifier that is out of scope", async () => {
      const result = await expandFunction(
        projectRoot,
        srcPath,
        functionWithHelper,
      );

      expect(result).not.toBeNull();
      expect(result?.file).toBe(path.resolve(srcPath, "index.ts"));
      expect(result?.startLine).toBe(17);
      expect(result?.startColumn).toBe(29);
      expect(result?.endLine).toBe(20);
      expect(result?.endColumn).toBe(2);

      expect(result?.context?.[0]?.definition?.text).toBe(
        `function helperFunction(req: HonoRequest): boolean {
  return req.query("shouldSayHello") === "true";
}`.trim(),
      );
    });
  });

  describe("multiple files - app/src/index.ts, app/src/utils.ts", () => {
    it("should return the function location and definition of a function identifier that is out of scope", async () => {
      const result = await expandFunction(
        projectRoot,
        srcPath,
        functionWithHelperInAnotherFile,
      );

      expect(result).not.toBeNull();
      expect(result?.file).toBe(path.resolve(srcPath, "index.ts"));
      expect(result?.startLine).toBe(22);
      expect(result?.startColumn).toBe(42);
      expect(result?.endLine).toBe(28);
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
  });

  describe("router file - app/src/other-router.ts", () => {
    it("should not return global web standards like console as out of scope identifiers", async () => {
      const result = await expandFunction(
        projectRoot,
        srcPath,
        functionWithWebStandardGlobals,
      );

      expect(result).not.toBeNull();
      expect(result?.file).toBe(path.resolve(srcPath, "other-router.ts"));
      expect(result?.startLine).toBe(9);
      expect(result?.startColumn).toBe(14);
      expect(result?.endLine).toBe(13);
      expect(result?.endColumn).toBe(2);

      // Context should be empty - no out of scope identifiers
      expect(result?.context).toHaveLength(0);

      const doesNotContainConsole = result?.context?.every(
        (context) => context.name !== "console",
      );
      expect(doesNotContainConsole).toBe(true);
      const doesNotContainLog = result?.context?.every(
        (context) => context.name !== "log",
      );
      expect(doesNotContainLog).toBe(true);

      expect;
    });
  });
});

/**
 * TODO - Test for this (shouldHonk should be considered local scope)
 * 
  const { shouldHonk } = c.req.query();
  const honk = typeof shouldHonk !== "undefined" ? "Honk honk!" : "";

 */
