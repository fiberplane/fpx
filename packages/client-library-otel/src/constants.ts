/**
 * Constants for the environment variables we use to configure the library.
 */
export const ENV_FIBERPLANE_OTEL_TOKEN = "FIBERPLANE_OTEL_TOKEN";
export const ENV_FPX_AUTH_TOKEN = "FPX_AUTH_TOKEN";

export const ENV_FIBERPLANE_OTEL_ENDPOINT = "FIBERPLANE_OTEL_ENDPOINT";
export const ENV_FPX_ENDPOINT = "FPX_ENDPOINT";

export const ENV_FIBERPLANE_OTEL_LOG_LEVEL = "FIBERPLANE_OTEL_LOG_LEVEL";
export const ENV_FPX_LOG_LEVEL = "FPX_LOG_LEVEL";

export const ENV_FIBERPLANE_SERVICE_NAME = "FIBERPLANE_SERVICE_NAME";
export const ENV_FPX_SERVICE_NAME = "FPX_SERVICE_NAME";

/**
 * The environment the library is running in.
 * If the value is "local", the library will send sensitive information (env, request body, sensitive headers)
 * to the OpenTelemetry Collector.
 */
export const ENV_FIBERPLANE_ENVIRONMENT = "FIBERPLANE_ENVIRONMENT";

/**
 * SEMATTRS_* are constants that should actually be exposed by the Samantic Conventions package
 * but are not.
 */
export const EXTRA_SEMATTRS_HTTP_REQUEST_METHOD = "http.request.method";
export const EXTRA_SEMATTRS_HTTP_RESPONSE_STATUS_CODE =
  "http.response.status_code";
export const EXTRA_SEMATTRS_URL_FULL = "url.full";

export const FPX_REQUEST_PATHNAME = "fpx.http.request.pathname";
export const FPX_REQUEST_SEARCH = "fpx.http.request.search";
export const FPX_REQUEST_SCHEME = "fpx.http.request.scheme";
export const FPX_REQUEST_BODY = "fpx.http.request.body";
export const FPX_REQUEST_ENV = "fpx.http.request.env";
export const FPX_RESPONSE_BODY = "fpx.http.response.body";
/**
 * This attribute is used to indicate if the client library is running in local mode.
 * In local mode, the client library will send sensitive information (env, request body)
 * to the Fiberplane Studio.
 */
export const FPX_REQUEST_IS_LOCAL = "fpx.http.request.is_local";

export const CF_BINDING_TYPE = "cf.binding.type";
export const CF_BINDING_NAME = "cf.binding.name";
export const CF_BINDING_METHOD = "cf.binding.method";
export const CF_BINDING_RESULT = "cf.binding.result";
export const CF_BINDING_ERROR = "cf.binding.error";

// NOT YET IMPLEMENTED
export const FPX_REQUEST_HANDLER_FILE = "fpx.http.request.handler.file";
export const FPX_REQUEST_HANDLER_SOURCE_CODE =
  "fpx.http.request.handler.source_code";

/**
 * These are the headers opentelemetry suggests to ignore when collecting traces.
 * In practice, we only redact their values when running in production mode.
 */
export const IGNORED_HEADERS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-real-ip",
  "x-forwarded-for",
  "proxy-authorization",
  "www-authenticate",
  "proxy-authenticate",
]);
