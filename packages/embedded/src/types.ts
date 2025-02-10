import { Hono } from "hono";
import type { Env } from "hono/types";

export interface EmbeddedOptions {
  /**
   * (Optional) Fiberplane API key to use for the embedded playground api.
   *
   * If not provided, certain features like the Workflow Builder will be disabled.
   */
  apiKey?: string;
  /**
   * (Optional) URL of a custom CDN to use for the embedded playground UI.
   *
   * If not provided, the default CDN will be used.
   */
  cdn?: string;
  openapi?: OpenAPIOptions;

  /**
   * Enable debug statements
   */
  debug?: boolean;
}

export interface ResolvedEmbeddedOptions extends EmbeddedOptions {
  mountedPath: string;
  fpxEndpoint?: string;
}

export interface SanitizedEmbeddedOptions
  extends Omit<ResolvedEmbeddedOptions, "apiKey"> {}

export interface OpenAPIOptions {
  /**
   * The URL of the (JSON) OpenAPI spec.
   *
   * Examples:
   * - Same origin: "/openapi.json"
   * - Different origin: "http://api.myapp.biz/openapi.json"
   */
  url?: string;
  /**
   * A JSON-stringified object representing an OpenAPI spec.
   */
  content?: string;
}

export interface FiberplaneAppType {
  Variables: {
    debug: boolean;
  };
}

export function logIfDebug(
  debug: boolean,
  message?: unknown,
  ...params: unknown[]
) {
  if (debug) {
    console.debug(message, params);
  }
}
