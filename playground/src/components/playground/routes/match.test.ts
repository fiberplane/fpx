import type { ApiRoute, RequestMethod } from "../types";
import { findFirstSmartRouterMatch } from "./match";

const toRoute = (
  path: string,
  method: RequestMethod,
  registrationOrder = -1,
) => ({
  id: 1,
  path,
  method,
  registrationOrder,
  openApiSpec: null,
});

describe("findSmartRouterMatch", () => {
  const routes: ApiRoute[] = [
    toRoute("/test", "GET"),
    toRoute("/test", "POST"),
    toRoute("/users/:userId", "GET"),
    toRoute("/users/:userId", "PATCH"),
    toRoute("/users/:userId/comments/:commentId", "GET"),
    toRoute("/users/:userId/comments/:commentId", "PATCH"),
    toRoute("/ws", "GET"),
  ];

  it("should return a match for the given pathname and method", () => {
    const match = findFirstSmartRouterMatch(routes, "/test", "GET");
    expect(match).toBeTruthy();
  });

  it("should return a match for the given pathname and method", () => {
    const match = findFirstSmartRouterMatch(routes, "/test", "POST");
    expect(match).toBeTruthy();
  });

  // NOTE - Basically just testing router behavior but this is a sanity check for me
  it("should return null if no match is found (params in route)", () => {
    const match = findFirstSmartRouterMatch(routes, "/users", "GET");
    expect(match).toBeNull();
  });

  it("should return a match for the given pathname and method", () => {
    const match = findFirstSmartRouterMatch(routes, "/users/1", "GET");
    expect(match).toBeTruthy();
    expect(match?.route).toBeDefined();
    expect(match?.route?.method).toBe("GET");
    expect(match?.route?.path).toBe("/users/:userId");
    expect(match?.pathParams).toMatchObject({
      userId: "1",
    });
  });
});

describe("findFirstSmartRouterMatch - registered routes precedence", () => {
  const routes: ApiRoute[] = [
    // Unregesterd route - should not be matched first
    toRoute("/test/:k", "GET", -1),
    // Registered route - should be matched first
    toRoute("/test/:key", "GET", 1),
  ];

  it("should return registered route with higher precedence", () => {
    const match = findFirstSmartRouterMatch(routes, "/test/123", "GET");
    expect(match).toBeTruthy();
    expect(match?.route?.path).toBe("/test/:key");
  });
});
