import type { Context } from "hono";

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

export function logIfDebug(debug: boolean, message: unknown): void;
export function logIfDebug(debug: Context, message: unknown): void;
export function logIfDebug(
  debug: boolean | Context,
  message: unknown,
  ...params: unknown[]
): void {
  try {
    // If debug is a boolean, we use it directly
    // If "debug" is a Context, we check the debug flag from the context's variable's map
    const debugEnabled =
      typeof debug === "boolean" ? debug : !!debug?.get("debug");
    if (debugEnabled) {
      console.debug("[fiberplane:debug] ", message, ...params);
    }
  } catch {
    // If the debug log failed for whatever reason, we'll just swallow the error
  }
}
