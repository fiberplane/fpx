// NOTE - Change this value to http://127.0.0.1:3578/github to test against locally running fp-services
// NOTE - If testing locally, make sure the host lines up with your callback in the OAuth app settings
// export const FP_SERVICES_LOGIN_URL = "http://127.0.0.1:3578/github";
export const FP_SERVICES_LOGIN_URL =
  "https://fp-services.mies.workers.dev/github";

/**
 * SEMATTRS_* are constants that should actually be exposed by the Semantic Conventions package
 * but are not. These are the ones that are used in the frontend and the client library.
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

export const CF_BINDING_TYPE = "cf.binding.type";
export const CF_BINDING_NAME = "cf.binding.name";
export const CF_BINDING_METHOD = "cf.binding.method";
export const CF_BINDING_RESULT = "cf.binding.result";
export const CF_BINDING_ERROR = "cf.binding.error";

// <note>
// THESE FPX_* attrs NOT YET IMPLEMENTED
export const FPX_REQUEST_HANDLER_FILE = "fpx.http.request.handler.file";
export const FPX_REQUEST_HANDLER_SOURCE_CODE =
  "fpx.http.request.handler.source_code";
// </note>

export const SpanStatus = {
  UNSET: 0,
  OK: 1,
  ERROR: 2,
};

export const SpanKind = {
  /** Default value. Indicates that the span is used internally. */
  INTERNAL: "Internal",
  /**
   * Indicates that the span covers server-side handling of an RPC or other
   * remote request.
   */
  SERVER: "Server",
  /**
   * Indicates that the span covers the client-side wrapper around an RPC or
   * other remote request.
   */
  CLIENT: "Client",
  /**
   * Indicates that the span describes producer sending a message to a
   * broker. Unlike client and server, there is no direct critical path latency
   * relationship between producer and consumer spans.
   */
  PRODUCER: "Producer",
  /**
   * Indicates that the span describes consumer receiving a message from a
   * broker. Unlike client and server, there is no direct critical path latency
   * relationship between producer and consumer spans.
   */
  CONSUMER: "Consumer",
};

export const REQUESTS_ROUTE = "/requests";
export const REQUEST_DETAILS_OTEL_ROUTE = "/requests/otel/:traceId";
export const REQUEST_DETAILS_TRACE_ROUTE = "/requests/:traceId";
export const ROOT_ROUTE = "/";
export const REQUESTOR_TRACE_ROUTE = "/:requestType/:traceId";

export const TRACE_ID_ROUTES = [
  REQUEST_DETAILS_OTEL_ROUTE,
  REQUEST_DETAILS_TRACE_ROUTE,
  REQUESTOR_TRACE_ROUTE,
];
