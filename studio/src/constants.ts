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

export const REQUEST_HEADERS = [
  "A-IM",
  "Accept",
  "Accept-Additions",
  "Accept-CH",
  "Accept-Charset",
  "Accept-Datetime",
  "Accept-Encoding",
  "Accept-Features",
  "Accept-Language",
  "Accept-Patch",
  "Accept-Post",
  "Accept-Ranges",
  "Accept-Signature",
  "Access-Control",
  "Access-Control-Allow-Credentials",
  "Access-Control-Allow-Headers",
  "Access-Control-Allow-Methods",
  "Access-Control-Allow-Origin",
  "Access-Control-Expose-Headers",
  "Access-Control-Max-Age",
  "Access-Control-Request-Headers",
  "Access-Control-Request-Method",
  "Age",
  "Allow",
  "ALPN",
  "Alt-Svc",
  "Alt-Used",
  "Alternates",
  "AMP-Cache-Transform",
  "Apply-To-Redirect-Ref",
  "Authentication-Control",
  "Authentication-Info",
  "Authorization",
  "Available-Dictionary",
  "C-Ext",
  "C-Man",
  "C-Opt",
  "C-PEP",
  "C-PEP-Info",
  "Cache-Control",
  "Cache-Status",
  "Cal-Managed-ID",
  "CalDAV-Timezones",
  "Capsule-Protocol",
  "CDN-Cache-Control",
  "CDN-Loop",
  "Cert-Not-After",
  "Cert-Not-Before",
  "Clear-Site-Data",
  "Client-Cert",
  "Client-Cert-Chain",
  "Close",
  "CMCD-Object",
  "CMCD-Request",
  "CMCD-Session",
  "CMCD-Status",
  "CMSD-Dynamic",
  "CMSD-Static",
  "Concealed-Auth-Export",
  "Configuration-Context",
  "Connection",
  "Content-Base",
  "Content-Digest",
  "Content-Disposition",
  "Content-Encoding",
  "Content-ID",
  "Content-Language",
  "Content-Length",
  "Content-Location",
  "Content-MD5",
  "Content-Range",
  "Content-Script-Type",
  "Content-Security-Policy",
  "Content-Security-Policy-Report-Only",
  "Content-Style-Type",
  "Content-Type",
  "Content-Version",
  "Cookie",
  "Cookie2",
  "Cross-Origin-Embedder-Policy",
  "Cross-Origin-Embedder-Policy-Report-Only",
  "Cross-Origin-Opener-Policy",
  "Cross-Origin-Opener-Policy-Report-Only",
  "Cross-Origin-Resource-Policy",
  "CTA-Common-Access-Token",
  "DASL",
  "Date",
  "DAV",
  "Default-Style",
  "Delta-Base",
  "Deprecation",
  "Depth",
  "Derived-From",
  "Destination",
  "Differential-ID",
  "Dictionary-ID",
  "Digest",
  "DPoP",
  "DPoP-Nonce",
  "Early-Data",
  "EDIINT-Features",
  "ETag",
  "Expect",
  "Expect-CT",
  "Expires",
  "Ext",
  "Forwarded",
  "From",
  "GetProfile",
  "Hobareg",
  "Host",
  "HTTP2-Settings",
  "If",
  "If-Match",
  "If-Modified-Since",
  "If-None-Match",
  "If-Range",
  "If-Schedule-Tag-Match",
  "If-Unmodified-Since",
  "IM",
  "Include-Referred-Token-Binding-ID",
  "Isolation",
  "Keep-Alive",
  "Label",
  "Last-Event-ID",
  "Last-Modified",
  "Link",
  "Link-Template",
  "Location",
  "Lock-Token",
  "Man",
  "Max-Forwards",
  "Memento-Datetime",
  "Meter",
  "Method-Check",
  "Method-Check-Expires",
  "MIME-Version",
  "Negotiate",
  "NEL",
  "OData-EntityId",
  "OData-Isolation",
  "OData-MaxVersion",
  "OData-Version",
  "Opt",
  "Optional-WWW-Authenticate",
  "Ordering-Type",
  "Origin",
  "Origin-Agent-Cluster",
  "OSCORE",
  "OSLC-Core-Version",
  "Overwrite",
  "P3P",
  "PEP",
  "PEP-Info",
  "Permissions-Policy",
  "PICS-Label",
  "Ping-From",
  "Ping-To",
  "Position",
  "Pragma",
  "Prefer",
  "Preference-Applied",
  "Priority",
  "ProfileObject",
  "Protocol",
  "Protocol-Info",
  "Protocol-Query",
  "Protocol-Request",
  "Proxy-Authenticate",
  "Proxy-Authentication-Info",
  "Proxy-Authorization",
  "Proxy-Features",
  "Proxy-Instruction",
  "Proxy-Status",
  "Public",
  "Public-Key-Pins",
  "Public-Key-Pins-Report-Only",
  "Range",
  "Redirect-Ref",
  "Referer",
  "Referer-Root",
  "Referrer-Policy",
  "Refresh",
  "Repeatability-Client-ID",
  "Repeatability-First-Sent",
  "Repeatability-Request-ID",
  "Repeatability-Result",
  "Replay-Nonce",
  "Reporting-Endpoints",
  "Repr-Digest",
  "Retry-After",
  "Safe",
  "Schedule-Reply",
  "Schedule-Tag",
  "Sec-GPC",
  "Sec-Purpose",
  "Sec-Token-Binding",
  "Sec-WebSocket-Accept",
  "Sec-WebSocket-Extensions",
  "Sec-WebSocket-Key",
  "Sec-WebSocket-Protocol",
  "Sec-WebSocket-Version",
  "Security-Scheme",
  "Server",
  "Server-Timing",
  "Set-Cookie",
  "Set-Cookie2",
  "SetProfile",
  "Signature",
  "Signature-Input",
  "SLUG",
  "SoapAction",
  "Status-URI",
  "Strict-Transport-Security",
  "Sunset",
  "Surrogate-Capability",
  "Surrogate-Control",
  "TCN",
  "TE",
  "Timeout",
  "Timing-Allow-Origin",
  "Topic",
  "Traceparent",
  "Tracestate",
  "Trailer",
  "Transfer-Encoding",
  "TTL",
  "Upgrade",
  "Urgency",
  "URI",
  "Use-As-Dictionary",
  "User-Agent",
  "Variant-Vary",
  "Vary",
  "Via",
  "Want-Content-Digest",
  "Want-Digest",
  "Want-Repr-Digest",
  "Warning",
  "WWW-Authenticate",
  "X-Content-Type-Options",
  "X-Frame-Options",
] as const;
