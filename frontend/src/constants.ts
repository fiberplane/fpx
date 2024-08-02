/**
 * SEMATTRS_* are constants that should actually be exposed by the Samantic Conventions package
 * but are not. These are the ones that are used in the frontend and the client library.
 */
export const EXTRA_SEMATTRS_HTTP_REQUEST_METHOD = "http.request.method";
export const EXTRA_SEMATTRS_HTTP_RESPONSE_STATUS_CODE =
  "http.response.status_code";
export const EXTRA_SEMATTRS_URL_FULL = "url.full";

// export const FPX_REQUEST_HEADERS_FULL = "fpx.http.request.headers_full";
// export const FPX_REQUEST_PATHNAME = "fpx.http.request.pathname";
// export const FPX_REQUEST_SEARCH = "fpx.http.request.search";
// export const FPX_REQUEST_SCHEME = "fpx.http.request.scheme";
// export const FPX_REQUEST_BODY = "fpx.http.request.body";
export const FPX_REQUEST_PATHNAME = "fpx.http.request_pathname";
export const FPX_REQUEST_SEARCH = "fpx.http.request_search";
export const FPX_REQUEST_SCHEME = "fpx.http.request_scheme";
export const FPX_REQUEST_BODY = "fpx.http.request_body";

// export const FPX_RESPONSE_HEADERS_FULL = "fpx.http.response_headers_full";
export const FPX_RESPONSE_BODY = "fpx.http.response_body";

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
