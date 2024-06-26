import { diffPaths } from "./routes/diff-paths";

describe("diffPaths", () => {
  it("handles realistic case: `/users/:id` and `/users/:i`", () => {
    const result = diffPaths("/users/:id", "/users/:i");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual([":id", ":i"]);
  });

  it("handles realistic case: `/users/:id` and `/users/:`", () => {
    const result = diffPaths("/users/:id", "/users/:");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual([":id", ":"]);
  });

  it("handles realistic case: `/users/:id` and `/users/`", () => {
    const result = diffPaths("/users/:id", "/users/");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual([":id", ""]);
  });

  it("handles realistic case: `/users/:id` and `/users`", () => {
    const result = diffPaths("/users/:id", "/users");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual([":id", undefined]);
  });

  it("handles simple case: `/a` and `/b`", () => {
    const result = diffPaths("/a", "/b");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(["a", "b"]);
  });

  it("handles when new path is empty string", () => {
    const result = diffPaths("/a", "");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(["a", undefined]);
  });

  it("handle when old path is empty string", () => {
    const result = diffPaths("", "/b");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual([undefined, "b"]);
  });

  it('handles weird base case: "" and "//"', () => {
    const result = diffPaths("", "//");
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual([undefined, ""]);
  });
});
