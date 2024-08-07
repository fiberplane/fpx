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
export type HonoFetchResult = Response | Promise<Response>;
// export type HonoFetchResult = ReturnType<Hono["fetch"]>;
export type HonoResponse = Awaited<HonoFetchResult>;
// export type HonoResponse = Awaited<HonoFetchResult>;
