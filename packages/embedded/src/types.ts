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
  url?: string;
  content?: string;
}
