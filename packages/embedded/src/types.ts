export interface EmbeddedOptions {
  apiKey: string;
  cdn?: string;
  openapi?: OpenAPIOptions;
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
   * Example: "/openapi.json" if on the same origin
   * Example: "http://api.myapp.biz/openapi.json" if on a different origin
   */
  url?: string;
  /**
   * A JSON-stringified object representing an OpenAPI spec.
   */
  content?: string;
}
