import { describe, expect, it } from "vitest";
import { cleanPrompt, invokeScaffoldAppPrompt } from "./prompts";

describe("prompts", () => {
  describe("invokeScaffoldAppPrompt", () => {
    it("should invoke the scaffoldAppPrompt with correct parameters", async () => {
      const params = {
        indexFile: "index content",
        schemaFile: "schema content",
        seedFile: "seed content",
        userPrompt: "user prompt",
      };

      const promptPromise = invokeScaffoldAppPrompt(params);

      await expect(promptPromise).resolves.not.toThrow();
      expect(promptPromise).resolves.toContain("index content");
      expect(promptPromise).resolves.toContain("schema content");
      expect(promptPromise).resolves.toContain("seed content");
      expect(promptPromise).resolves.toContain("user prompt");
      // Test escaping of curly braces
      expect(promptPromise).resolves.toContain(
        'import { count } from "drizzle-orm";',
      );
      expect(promptPromise).resolves.toContain(
        "const [ { count: usersCount } ] = await db.select({ count: count() }).from(schema.users);",
      );
    });
  });

  describe("cleanPrompt", () => {
    it("should trim whitespace and join lines", () => {
      const input = `
        Line 1
        Line 2
          Line 3 with extra space
        Line 4
      `;
      const expected = "Line 1\nLine 2\nLine 3 with extra space\nLine 4";
      expect(cleanPrompt(input)).toBe(expected);
    });

    it("should handle empty input", () => {
      expect(cleanPrompt("")).toBe("");
    });

    it("should handle single line input", () => {
      expect(cleanPrompt("  Single line  ")).toBe("Single line");
    });
  });
});
