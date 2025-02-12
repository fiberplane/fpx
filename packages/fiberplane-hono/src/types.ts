import type { Env, Hono } from "hono";

export interface EmbeddedOptions<E extends Env> {
  /**
   * (Optional) Fiberplane API key to use for the embedded playground api.
   *
   * The middleware will attempt to fall back to the `FIBERPLANE_API_KEY` environment variable if not set as an option.
   *
   * _Without an API key, certain features like the Workflow Builder will be disabled._
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
   * The Hono app to use for the embedded runner.
   */
  app: Hono<E>;
  /**
   * Enable debug statements
   */
  debug?: boolean;
}

export interface ResolvedEmbeddedOptions<E extends Env> extends EmbeddedOptions<E> {
  mountedPath: string;
  fpxEndpoint?: string;
  userApp: Hono<E>;
  userEnv: Env;
}

export interface SanitizedEmbeddedOptions<E extends Env>
  extends Omit<ResolvedEmbeddedOptions<E>, "apiKey"> {}

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

export interface FiberplaneAppType<E extends Env> {
  Variables: {
    debug: boolean;
    userApp: Hono<E>;
    userEnv: Env;
  };
}
