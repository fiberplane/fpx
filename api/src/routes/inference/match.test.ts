import type { AppRoute } from "../../db/schema.js";
import { findFirstSmartRouterMatch } from "./match.js";

const toRoute = (
  path: string,
  method: string,
  requestType: "http" | "websocket",
  currentlyRegistered = false,
  registrationOrder = -1,
) => ({
  id: 2345345,
  path,
  method,
  requestType,
  handler: "",
  handlerType: "route" as const,
  currentlyRegistered,
  registrationOrder,
  routeOrigin: "custom" as const,
  openApiSpec: null,
});

describe("findSmartRouterMatch", () => {
  const routes: AppRoute[] = [
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
  const routes: AppRoute[] = [
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

// describe("findMatchedRoute", () => {
//   const routes: ProbedRoute[] = [
//     { path: "/test", method: "GET", isWs: false },
//     { path: "/test", method: "POST", isWs: false },
//     { path: "/ws", method: "GET", isWs: true },
//   ];

//   it("should return the correct route for given pathname and method", () => {
//     const result = findMatchedRoute(routes, "/test", "GET", false);
//     expect(result).toEqual({ path: "/test", method: "GET", isWs: false });
//   });

//   it("should return undefined if no matching route is found", () => {
//     const result = findMatchedRoute(routes, "/nonexistent", "GET", false);
//     expect(result).toBeUndefined();
//   });

//   it("should return the correct WebSocket route", () => {
//     const result = findMatchedRoute(routes, "/ws", "GET", true);
//     expect(result).toEqual({ path: "/ws", method: "GET", isWs: true });
//   });
// });
