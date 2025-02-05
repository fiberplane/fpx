import type { ApiRoute, RequestMethod, RequestType } from "../types";
import { findFirstSmartRouterMatch } from "./match";

const toRoute = (
  path: string,
  method: RequestMethod,
  requestType: RequestType,
  currentlyRegistered = false,
  registrationOrder = -1,
) => ({
  id: 1,
  path,
  method,
  requestType,
  handler: "",
  handlerType: "route" as const,
  currentlyRegistered,
  registrationOrder,
  routeOrigin: "custom" as const,
  isDraft: false,
});

describe("findSmartRouterMatch", () => {
  const routes: ApiRoute[] = [
    toRoute("/test", "GET", "http"),
    toRoute("/test", "POST", "http"),
    toRoute("/users/:userId", "GET", "http"),
    toRoute("/users/:userId", "PATCH", "http"),
    toRoute("/users/:userId/comments/:commentId", "GET", "http"),
    toRoute("/users/:userId/comments/:commentId", "PATCH", "http"),
    toRoute("/ws", "GET", "websocket"),
  ];

  it("should return a match for the given pathname and method", () => {
    const match = findFirstSmartRouterMatch(routes, "/test", "GET", "http");
    expect(match).toBeTruthy();
  });

  it("should return a match for the given pathname and method", () => {
    const match = findFirstSmartRouterMatch(routes, "/test", "POST", "http");
    expect(match).toBeTruthy();
  });

  // NOTE - Basically just testing router behavior but this is a sanity check for me
  it("should return null if no match is found (params in route)", () => {
    const match = findFirstSmartRouterMatch(routes, "/users", "GET", "http");
    expect(match).toBeNull();
  });

  it("should return a match for the given pathname and method", () => {
    const match = findFirstSmartRouterMatch(routes, "/users/1", "GET", "http");
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
    toRoute("/test/:k", "GET", "http", false, -1),
    // Registered route - should be matched first
    toRoute("/test/:key", "GET", "http", true, 1),
  ];

  it("should return registered route with higher precedence", () => {
    const match = findFirstSmartRouterMatch(routes, "/test/123", "GET", "http");
    expect(match).toBeTruthy();
    expect(match?.route?.path).toBe("/test/:key");
  });
});
