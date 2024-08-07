/**
 * Before you try to import Hono and use its types,
 * it's good to know that Hono's types are not compatible across
 * independently installed versions of Hono.
 *
 * I've kept *commented out* Hono derived types below for reference,
 * so you know that they will not work.
 */

// import type { Hono } from "hono";
type GlobalFetch = typeof globalThis.fetch;
type GlobalFetchArgs = Parameters<GlobalFetch>;
export type GlobalResponse = Awaited<ReturnType<GlobalFetch>>;
export type InputParam = GlobalFetchArgs[0];
export type InitParam = GlobalFetchArgs[1];

/**
 * Hack type to make our library's types play nicely with Hono types.
 */
export type HonoFetchResult = Response | Promise<Response>;
// export type HonoFetchResult = ReturnType<Hono["fetch"]>;

/**
 * Hack type to make our library's types play nicely with Hono types.
 */
export type HonoResponse = Awaited<HonoFetchResult>;
// export type HonoResponse = Awaited<HonoFetchResult>;

/**
 * Hack type to make our library's types play nicely with Hono types.
 */
export type HonoLikeFetch = (
  request: Request,
  env: unknown,
  executionContext: ExecutionContext | undefined,
) => HonoFetchResult;
// type HonoLikeFetch = Hono["fetch"];

/**
 * Hack type to make our library's types play nicely with Hono types.
 */
export type HonoLikeApp = {
  fetch: HonoLikeFetch;
  routes: RouterRoute[];
};

type RouterRoute = {
  method: string;
  path: string;
  // We can't use the type of a handler that's exported by Hono.
  // When we do that, our types end up mismatching with the user's app!
  //
  // biome-ignore lint/complexity/noBannedTypes:
  handler: Function;
};
