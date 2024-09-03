import type { ProbedRoute, RequestMethod, RequestType } from "../types";
import { findSmartRouterMatches } from "./match";

const toRoute = (
  path: string,
  method: RequestMethod,
  requestType: RequestType,
) => ({
  path,
  method,
  requestType,
  handler: "",
  handlerType: "route" as const,
  currentlyRegistered: false,
  routeOrigin: "custom" as const,
  isDraft: false,
});

describe("findSmartRouterMatch", () => {
  const routes: ProbedRoute[] = [
    toRoute("/test", "GET", "http"),
    toRoute("/test", "POST", "http"),
    toRoute("/users/:userId", "GET", "http"),
    toRoute("/users/:userId", "PATCH", "http"),
    toRoute("/users/:userId/comments/:commentId", "GET", "http"),
    toRoute("/users/:userId/comments/:commentId", "PATCH", "http"),
    toRoute("/ws", "GET", "websocket"),
  ];

  it("should return a match for the given pathname and method", () => {
    const match = findSmartRouterMatches(routes, "/test", "GET", "http");
    console.log("/test match", match);
    expect(match).toBeTruthy();
  });

  it("should return a match for the given pathname and method", () => {
    const match = findSmartRouterMatches(routes, "/test", "POST", "http");
    expect(match).toBeTruthy();
  });

  // NOTE - Basically just testing router behavior but this is a sanity check for me
  it("should return null if no match is found (params in route)", () => {
    const match = findSmartRouterMatches(routes, "/users", "GET", "http");
    expect(match).toBeNull();
  });

  it("should return a match for the given pathname and method", () => {
    const match = findSmartRouterMatches(routes, "/users/1", "GET", "http");
    expect(match).toMatchObject({
      path: "/users/:userId",
      method: "GET",
      isWs: false,
    });
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
