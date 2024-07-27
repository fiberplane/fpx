import { ProbedRoute } from "../queries";
import { findSmartRouterMatches } from "./match";

const toRoute = (path: string, method: string, isWs: boolean) => ({
  path,
  method,
  isWs,
  handler: "",
  handlerType: "route" as const,
  currentlyRegistered: false,
  routeOrigin: "custom" as const,
  isDraft: false,
});

describe("findSmartRouterMatch", () => {
  const routes: ProbedRoute[] = [
    toRoute("/test", "GET", false),
    toRoute("/test", "POST", false),
    toRoute("/users/:userId", "GET", false),
    toRoute("/users/:userId", "PATCH", false),
    toRoute("/users/:userId/comments/:commentId", "GET", false),
    toRoute("/users/:userId/comments/:commentId", "PATCH", false),
    toRoute("/ws", "GET", true),
  ];

  it("should return a match for the given pathname and method", () => {
    const match = findSmartRouterMatches(routes, "/test", "GET");
    console.log("/test match", match);
    expect(match).toBeTruthy();
  });

  it("should return a match for the given pathname and method", () => {
    const match = findSmartRouterMatches(routes, "/test", "POST");
    expect(match).toBeTruthy();
  });

  // NOTE - Basically just testing router behavior but this is a sanity check for me
  it("should return null if no match is found (params in route)", () => {
    const match = findSmartRouterMatches(routes, "/users", "GET");
    expect(match).toBeNull();
  });

  it("should return a match for the given pathname and method", () => {
    const match = findSmartRouterMatches(routes, "/users/1", "GET");
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
