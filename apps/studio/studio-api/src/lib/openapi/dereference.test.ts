import { describe, expect, it } from "vitest";
import {
  CircularReferenceError,
  MissingReferenceError,
  dereferenceSchema,
  resolveRef,
} from "./dereference.js";

describe("resolveRef", () => {
  const mockComponents = {
    schemas: {
      Pet: {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
      },
      Error: {
        type: "object",
        properties: {
          code: { type: "integer" },
          message: { type: "string" },
        },
      },
    },
  };

  it("should resolve a simple reference", () => {
    const result = resolveRef("#/components/schemas/Pet", mockComponents);
    expect(result).toEqual(mockComponents.schemas.Pet);
  });

  it("should use cache for repeated references", () => {
    const cache = new Map();
    const ref = "#/components/schemas/Pet";

    const result1 = resolveRef(ref, mockComponents, new Set(), cache);
    const result2 = resolveRef(ref, mockComponents, new Set(), cache);

    expect(result1).toEqual(result2);
    expect(cache.get(ref)).toBeDefined();
  });

  it("should throw MissingReferenceError for non-existent reference", () => {
    expect(() =>
      resolveRef("#/components/schemas/NonExistent", mockComponents),
    ).toThrow(MissingReferenceError);
  });

  it("should throw CircularReferenceError for circular references", () => {
    const componentsWithCircular = {
      schemas: {
        A: { $ref: "#/components/schemas/B" },
        B: { $ref: "#/components/schemas/A" },
      },
    };

    expect(() =>
      resolveRef("#/components/schemas/A", componentsWithCircular),
    ).toThrow(CircularReferenceError);
  });
});

describe("dereferenceSchema", () => {
  const mockComponents = {
    schemas: {
      Pet: {
        type: "object",
        properties: {
          name: { type: "string" },
        },
      },
      Error: {
        type: "object",
        properties: {
          code: { type: "integer" },
        },
      },
    },
  };

  it("should dereference a simple schema", () => {
    const input = {
      type: "object",
      properties: {
        pet: { $ref: "#/components/schemas/Pet" },
      },
    };

    const expected = {
      type: "object",
      properties: {
        pet: mockComponents.schemas.Pet,
      },
    };

    const result = dereferenceSchema(input, mockComponents);
    expect(result).toEqual(expected);
  });

  it("should handle nested references", () => {
    const input = {
      type: "object",
      properties: {
        pet: { $ref: "#/components/schemas/Pet" },
        error: { $ref: "#/components/schemas/Error" },
      },
    };

    const result = dereferenceSchema(input, mockComponents);
    expect(result.properties.pet).toEqual(mockComponents.schemas.Pet);
    expect(result.properties.error).toEqual(mockComponents.schemas.Error);
  });

  it("should handle arrays of references", () => {
    const input = {
      type: "array",
      items: [
        { $ref: "#/components/schemas/Pet" },
        { $ref: "#/components/schemas/Error" },
      ],
    };

    const result = dereferenceSchema(input, mockComponents);
    expect(result.items[0]).toEqual(mockComponents.schemas.Pet);
    expect(result.items[1]).toEqual(mockComponents.schemas.Error);
  });

  it("should return primitive values as-is", () => {
    const input = {
      type: "string",
      format: "email",
    };

    const result = dereferenceSchema(input, mockComponents);
    expect(result).toEqual(input);
  });

  it("should handle empty objects", () => {
    const input = {};
    const result = dereferenceSchema(input, mockComponents);
    expect(result).toEqual({});
  });
});
