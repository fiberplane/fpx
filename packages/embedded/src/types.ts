export interface EmbeddedOptions {
  /**
   * (Optional) The API key to use for the embedded playground.
   *
   * If not provided, certain features like the Workflow Builder will be disabled.
   */
  apiKey?: string;
  /**
   * (Optional) The URL of the CDN to use for the embedded playground UI.
   */
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
