import { describe, expect, it } from "vitest";
import { trimJsonBody } from "./trim-json-body";

describe("trimJsonBody", () => {
  it("should return non-object values as is", () => {
    expect(trimJsonBody(null)).toBe(null);
    expect(trimJsonBody(42)).toBe(42);
    expect(trimJsonBody("string")).toBe("string");
  });

  it("should truncate long strings", () => {
    const longString = "a".repeat(200);
    const result = trimJsonBody({ key: longString });
    expect(result).toEqual({ key: `${"a".repeat(50)}...${"a".repeat(50)}` });
  });

  it("should truncate large arrays of numbers", () => {
    const largeArray = Array.from({ length: 20 }, (_, i) => i);
    const result = trimJsonBody({ key: largeArray });
    expect(result).toEqual({ key: [0, 1, 2, 3, 4, "...", 15, 16, 17, 18, 19] });
  });

  it("should truncate long arrays of strings", () => {
    const largeArray = Array.from({ length: 20 }, (_, i) => `string${i}`);
    const result = trimJsonBody({ key: largeArray });
    expect(result).toEqual({
      key: [
        "string0",
        "string1",
        "string2",
        "string3",
        "string4",
        "...",
        "string15",
        "string16",
        "string17",
        "string18",
        "string19",
      ],
    });
  });

  it("should recurse into nested objects", () => {
    const nestedObject = {
      level1: {
        level2: {
          key: "a".repeat(200),
        },
      },
    };
    const result = trimJsonBody(nestedObject);
    expect(result).toEqual({
      level1: {
        level2: {
          key: `${"a".repeat(50)}...${"a".repeat(50)}`,
        },
      },
    });
  });

  it("should handle mixed content", () => {
    const mixedContent = {
      string: "a".repeat(200),
      numbers: Array.from({ length: 20 }, (_, i) => i),
      strings: Array.from({ length: 20 }, (_, i) => `string${i}`),
      nested: {
        key: "a".repeat(200),
      },
    };
    const result = trimJsonBody(mixedContent);
    expect(result).toEqual({
      string: `${"a".repeat(50)}...${"a".repeat(50)}`,
      numbers: [0, 1, 2, 3, 4, "...", 15, 16, 17, 18, 19],
      strings: [
        "string0",
        "string1",
        "string2",
        "string3",
        "string4",
        "...",
        "string15",
        "string16",
        "string17",
        "string18",
        "string19",
      ],
      nested: {
        key: `${"a".repeat(50)}...${"a".repeat(50)}`,
      },
    });
  });
});
