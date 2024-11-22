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
  {
    label: "A-IM",
    info: "Indicates the acceptable delta-encoding mechanisms for the client",
    example: "A-IM: vcdiff, diffe, gzip"
  },
  {
    label: "Accept",
    info: "Informs the server about the types of data that can be sent back",
    example: "Accept: application/json, text/plain;q=0.9, */*;q=0.8"
  },
  {
    label: "Accept-Additions",
    info: "Indicates which add-on features the client supports",
    example: "Accept-Additions: vnd.fp.validation"
  },
  {
    label: "Accept-CH",
    info: "Servers use this header to advertise support for Client Hints",
    example: "Accept-CH: DPR, Width, Viewport-Width, Device-Memory"
  },
  {
    label: "Accept-Charset",
    info: "Tells the server which character sets the client can understand",
    example: "Accept-Charset: utf-8, iso-8859-1;q=0.8, utf-16;q=0.7"
  },
  {
    label: "Accept-Datetime",
    info: "Used to negotiate the time version of a resource in content negotiation",
    example: "Accept-Datetime: Tue, 15 Nov 2023 08:12:31 GMT"
  },
  {
    label: "Accept-Encoding",
    info: "Indicates which content encodings the client supports",
    example: "Accept-Encoding: br, gzip;q=0.8, deflate;q=0.6"
  },
  {
    label: "Accept-Features",
    info: "Used to specify which features are supported by the client",
    example: "Accept-Features: PostalAddress=3, Cookie=1"
  },
  {
    label: "Accept-Language",
    info: "Indicates the natural languages preferred for the response",
    example: "Accept-Language: en-US, en;q=0.9, es-ES;q=0.8, *;q=0.5"
  },
  {
    label: "Accept-Patch",
    info: "Advertises which patch document formats the server supports",
    example: "Accept-Patch: application/json-patch+json, application/merge-patch+json"
  },
  {
    label: "Accept-Post",
    info: "Advertises which media types are accepted in POST requests",
    example: "Accept-Post: application/json, multipart/form-data"
  },
  {
    label: "Accept-Ranges",
    info: "Indicates if the server supports range requests",
    example: "Accept-Ranges: bytes"
  },
  {
    label: "Access-Control-Allow-Credentials",
    info: "Part of CORS - indicates whether response can be shared when credentials mode is 'include'",
    example: "Access-Control-Allow-Credentials: true"
  },
  {
    label: "Access-Control-Allow-Headers",
    info: "Part of CORS - indicates which headers can be used during the actual request",
    example: "Access-Control-Allow-Headers: Content-Type, Authorization, X-Request-ID"
  },
  {
    label: "Access-Control-Allow-Methods",
    info: "Part of CORS - specifies the permitted HTTP methods for cross-origin requests",
    example: "Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"
  },
  {
    label: "Access-Control-Allow-Origin",
    info: "Part of CORS - indicates whether a resource can be shared with requesting origin",
    example: "Access-Control-Allow-Origin: https://app.fingerprint.com"
  },
  {
    label: "Access-Control-Expose-Headers",
    info: "Part of CORS - indicates which headers can be exposed as part of the response",
    example: "Access-Control-Expose-Headers: Content-Length, X-Request-ID"
  },
  {
    label: "Access-Control-Max-Age",
    info: "Part of CORS - indicates how long preflight request results can be cached",
    example: "Access-Control-Max-Age: 86400"
  },
  {
    label: "Age",
    info: "Time in seconds the object has been in a proxy cache",
    example: "Age: 12"
  },
  {
    label: "Allow",
    info: "Lists the set of HTTP request methods supported by a resource",
    example: "Allow: GET, HEAD, PUT"
  },
  {
    label: "Alt-Svc",
    info: "Used to list alternative services available via alternative protocols",
    example: "Alt-Svc: h2=\"alt.example.com:443\"; ma=2592000"
  },
  {
    label: "Authorization",
    info: "Contains credentials to authenticate a user with a server",
    example: "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  },
  {
    label: "Cache-Control",
    info: "Directives for caching in both requests and responses",
    example: "Cache-Control: private, no-cache, must-revalidate"
  },
  {
    label: "Connection",
    info: "Controls whether network connection stays open after current transaction finishes",
    example: "Connection: keep-alive"
  },
  {
    label: "Content-Disposition",
    info: "Indicates if content should be displayed inline or downloaded",
    example: "Content-Disposition: attachment; filename=\"report-2023.pdf\""
  },
  {
    label: "Content-Encoding",
    info: "Specifies the encoding transformations applied to the body",
    example: "Content-Encoding: gzip"
  },
  {
    label: "Content-Language",
    info: "Describes the natural language(s) intended for the audience",
    example: "Content-Language: en-US, es-MX"
  },
  {
    label: "Content-Length",
    info: "Size of the message body in bytes",
    example: "Content-Length: 2048"
  },
  {
    label: "Content-Location",
    info: "Indicates an alternate location for the returned data",
    example: "Content-Location: /api/v2/users/123"
  },
  {
    label: "Content-Range",
    info: "Indicates where in a full body message a partial message belongs",
    example: "Content-Range: bytes 200-1000/67589"
  },
  {
    label: "Content-Security-Policy",
    info: "Controls resources the user agent is allowed to load",
    example: "Content-Security-Policy: default-src 'self'; img-src *; script-src trusted.com"
  },
  {
    label: "Content-Type",
    info: "Indicates the media type of the resource",
    example: "Content-Type: application/json; charset=utf-8"
  },
  {
    label: "Cookie",
    info: "Contains stored HTTP cookies previously sent by the server",
    example: "Cookie: session_id=abc123; user_id=789; theme=dark"
  },
  {
    label: "Date",
    info: "Contains the date and time at which the message was originated",
    example: "Date: Wed, 21 Feb 2024 07:28:00 GMT"
  },
  {
    label: "ETag",
    info: "Identifier for a specific version of a resource",
    example: "ETag: \"33a64df551425fcc55e4d42a148795d9f25f89d4\""
  },
  {
    label: "Expect",
    info: "Indicates expectations that need to be fulfilled by server",
    example: "Expect: 100-continue"
  },
  {
    label: "Expires",
    info: "Date/time after which the response is considered stale",
    example: "Expires: Thu, 22 Feb 2024 07:28:00 GMT"
  },
  {
    label: "Forwarded",
    info: "Contains information from proxy servers about client",
    example: "Forwarded: for=192.0.2.60;proto=https;by=203.0.113.43"
  },
  {
    label: "From",
    info: "Email address of the person responsible for the request",
    example: "From: developer@example.com"
  },
  {
    label: "Host",
    info: "Specifies the domain name and port number of the server",
    example: "Host: api.example.com:443"
  },
  {
    label: "If-Match",
    info: "Makes request conditional based on matching ETags",
    example: "If-Match: \"737060cd8c284d8af7ad3082f209582d\""
  },
  {
    label: "If-Modified-Since",
    info: "Makes request conditional based on timestamp",
    example: "If-Modified-Since: Wed, 21 Feb 2024 07:28:00 GMT"
  },
  {
    label: "If-None-Match",
    info: "Makes request conditional based on non-matching ETags",
    example: "If-None-Match: \"737060cd8c284d8af7ad3082f209582d\""
  },
  {
    label: "If-Range",
    info: "Makes range request conditional",
    example: "If-Range: \"737060cd8c284d8af7ad3082f209582d\""
  },
  {
    label: "If-Unmodified-Since",
    info: "Makes request conditional based on timestamp",
    example: "If-Unmodified-Since: Wed, 21 Feb 2024 07:28:00 GMT"
  },
  {
    label: "Last-Modified",
    info: "Date and time at which the origin server believes the resource was last modified",
    example: "Last-Modified: Wed, 21 Feb 2024 07:28:00 GMT"
  },
  {
    label: "Link",
    info: "Provides links to other resources",
    example: "Link: </api/user/123>; rel=\"canonical\""
  },
  {
    label: "Location",
    info: "Used in redirection or when a new resource has been created",
    example: "Location: https://api.example.com/v2/users/123"
  },
  {
    label: "Max-Forwards",
    info: "Limits the number of times the message can be forwarded through proxies or gateways",
    example: "Max-Forwards: 10"
  },
  {
    label: "Origin",
    info: "Indicates where the cross-origin request originates from",
    example: "Origin: https://app.example.com"
  },
  {
    label: "Pragma",
    info: "Implementation-specific header for backwards compatibility",
    example: "Pragma: no-cache"
  },
  {
    label: "Proxy-Authenticate",
    info: "Defines the authentication method that should be used to access a resource behind a proxy server",
    example: "Proxy-Authenticate: Basic realm=\"Corporate Proxy\""
  },
  {
    label: "Proxy-Authorization",
    info: "Credentials for connecting to a proxy server",
    example: "Proxy-Authorization: Basic YWxhZGRpbjpvcGVuc2VzYW1l"
  },
  {
    label: "Range",
    info: "Requests only part of an entity",
    example: "Range: bytes=500-999"
  },
  {
    label: "Referer",
    info: "Address of the previous web page",
    example: "Referer: https://example.com/docs/api-reference"
  },
  {
    label: "Retry-After",
    info: "How long to wait before making a new request",
    example: "Retry-After: 120"
  },
  {
    label: "Server",
    info: "Information about the software used by the origin server",
    example: "Server: nginx/1.18.0"
  },
  {
    label: "Set-Cookie",
    info: "Send cookies from the server to the user agent",
    example: "Set-Cookie: sessionId=38afes7a8; HttpOnly; Secure; SameSite=Strict"
  },
  {
    label: "Strict-Transport-Security",
    info: "Forces communication over HTTPS",
    example: "Strict-Transport-Security: max-age=31536000; includeSubDomains"
  },
  {
    label: "TE",
    info: "Specifies transfer encodings the user agent is willing to accept",
    example: "TE: trailers, deflate;q=0.5"
  },
  {
    label: "Trailer",
    info: "Indicates which headers are present in the trailer of a chunked transfer",
    example: "Trailer: Expires"
  },
  {
    label: "Transfer-Encoding",
    info: "Specifies the form of encoding used to safely transfer the payload",
    example: "Transfer-Encoding: chunked"
  },
  {
    label: "Upgrade",
    info: "Asks the server to upgrade to another protocol",
    example: "Upgrade: websocket"
  },
  {
    label: "User-Agent",
    info: "String identifying the client software",
    example: "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
  },
  {
    label: "Vary",
    info: "Determines how to match future request headers to decide whether a cached response can be used",
    example: "Vary: Accept-Encoding, User-Agent"
  },
  {
    label: "Via",
    info: "Informs about proxies through which the response was sent",
    example: "Via: 1.1 varnish, 1.1 nginx"
  },
  {
    label: "Warning",
    info: "General warning information about possible problems",
    example: "Warning: 110 anderson/1.3.37 \"Response is stale\""
  },
  {
    label: "WWW-Authenticate",
    info: "Indicates the authentication scheme that should be used to access the resource",
    example: "WWW-Authenticate: Basic realm=\"Access to the staging site\""
  },
  {
    label: "X-Content-Type-Options",
    info: "Prevents browsers from MIME-sniffing",
    example: "X-Content-Type-Options: nosniff"
  },
  {
    label: "X-Frame-Options",
    info: "Clickjacking protection",
    example: "X-Frame-Options: DENY"
  },
  {
    label: "X-XSS-Protection",
    info: "Configure Cross-site scripting (XSS) filter in browsers",
    example: "X-XSS-Protection: 1; mode=block"
  },
  {
    label: "ALPN",
    info: "Application-Layer Protocol Negotiation, used to negotiate which protocol should be performed over a secure connection",
    example: "ALPN: h2, http/1.1"
  },
  {
    label: "Alt-Used",
    info: "Used to list alternative services in use",
    example: "Alt-Used: alternate.example.net:443"
  },
  {
    label: "Authentication-Info",
    info: "Provides information about the authentication carried out",
    example: "Authentication-Info: nextnonce=\"e966c5b86486f0b33594\""
  },
  {
    label: "Clear-Site-Data",
    info: "Clears browsing data (cookies, storage, cache) associated with the requesting website",
    example: "Clear-Site-Data: \"cache\", \"cookies\", \"storage\""
  },
  {
    label: "Digest",
    info: "Provides a digest of the requested resource",
    example: "Digest: sha-256=X48E9qOokqqrvdts8nOJRJN3OWDUoyWxBf7kbu9DBPE="
  },
  {
    label: "Early-Data",
    info: "Indicates that the request was sent in TLS early data",
    example: "Early-Data: 1"
  },
  {
    label: "Keep-Alive",
    info: "Controls how long a persistent connection should stay open",
    example: "Keep-Alive: timeout=5, max=1000"
  },
  {
    label: "Proxy-Connection",
    info: "Deprecated. Used to control connection behavior with proxy servers",
    example: "Proxy-Connection: keep-alive"
  },
  {
    label: "Public-Key-Pins",
    info: "Associates a specific cryptographic public key with a certain web server",
    example: "Public-Key-Pins: pin-sha256=\"base64==\"; max-age=5184000; includeSubDomains"
  },
  {
    label: "Sec-WebSocket-Accept",
    info: "Used in WebSocket handshake to confirm the server is willing to initiate a WebSocket connection",
    example: "Sec-WebSocket-Accept: HSmrc0sMlYUkAGmm5OPpG2HaGWk="
  },
  {
    label: "Sec-WebSocket-Key",
    info: "Provides information to the server that's needed to confirm the client is requesting a WebSocket connection",
    example: "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ=="
  },
  {
    label: "Sec-WebSocket-Protocol",
    info: "Specifies one or more WebSocket protocols",
    example: "Sec-WebSocket-Protocol: chat, superchat"
  },
  {
    label: "Sec-WebSocket-Version",
    info: "Specifies the WebSocket protocol version",
    example: "Sec-WebSocket-Version: 13"
  },
  {
    label: "Timing-Allow-Origin",
    info: "Specifies origins that are allowed to see values of attributes retrieved via features of the Resource Timing API",
    example: "Timing-Allow-Origin: *"
  },
  {
    label: "Traceparent",
    info: "Identifies the trace context in distributed tracing",
    example: "traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01"
  },
  {
    label: "Tracestate",
    info: "Provides additional vendor-specific trace identification information",
    example: "tracestate: congo=t61rcWkgMzE"
  },
  {
    label: "Alternates",
    info: "Identifies alternative representations of a resource",
    example: "Alternates: {\"paper.html\" 0.9 {type text/html}}"
  },
  {
    label: "AMP-Cache-Transform",
    info: "Requests documents be transformed by AMP Cache",
    example: "AMP-Cache-Transform: google;v=\"1..\""
  },
  {
    label: "Available-Dictionary",
    info: "Indicates which compression dictionaries are available",
    example: "Available-Dictionary: \"example-dictionary-1\", \"example-dictionary-2\""
  },
  {
    label: "CDN-Cache-Control",
    info: "Provides directives for CDN caching behavior",
    example: "CDN-Cache-Control: max-age=300"
  },
  {
    label: "CDN-Loop",
    info: "Helps detect and prevent infinite loops between CDNs",
    example: "CDN-Loop: cloudflare"
  },
  {
    label: "Content-MD5",
    info: "Base64-encoded MD5 sum of the content",
    example: "Content-MD5: Q2hlY2sgSW50ZWdyaXR5IQ=="
  },
  {
    label: "Content-Script-Type",
    info: "Specifies the default scripting language for the response",
    example: "Content-Script-Type: application/javascript"
  },
  {
    label: "Content-Style-Type",
    info: "Specifies the default style sheet language for the response",
    example: "Content-Style-Type: text/css"
  },
  {
    label: "Content-Version",
    info: "Indicates the version of the resource",
    example: "Content-Version: 2.5.0"
  },
  {
    label: "Delta-Base",
    info: "Specifies the base resource for delta encoding",
    example: "Delta-Base: \"abc123\""
  },
  {
    label: "Differential-ID",
    info: "Identifies the differential update being applied",
    example: "Differential-ID: \"patch-2024-02-21\""
  },
  {
    label: "Hobareg",
    info: "Used for OAuth 2.0 Dynamic Client Registration",
    example: "Hobareg: reguri.example.com"
  },
  {
    label: "Isolation",
    info: "Controls the isolation level for database transactions",
    example: "Isolation: snapshot"
  },
  {
    label: "Label",
    info: "Identifies a specific version of a resource",
    example: "Label: \"v2.1-stable\""
  },
  {
    label: "Memento-Datetime",
    info: "Indicates when the original resource was captured",
    example: "Memento-Datetime: Tue, 20 Feb 2024 10:00:00 GMT"
  },
  {
    label: "Method-Check",
    info: "Specifies allowed HTTP methods for resource",
    example: "Method-Check: GET, POST, PUT"
  },
  {
    label: "Method-Check-Expires",
    info: "Indicates when method check information expires",
    example: "Method-Check-Expires: Wed, 21 Feb 2024 07:28:00 GMT"
  },
  {
    label: "Position",
    info: "Indicates the position in a sequence of fragments",
    example: "Position: first"
  },
  {
    label: "Protocol-Info",
    info: "Provides information about the protocol used",
    example: "Protocol-Info: version=1.1; security=TLS1.3"
  },
  {
    label: "Protocol-Query",
    info: "Used to query protocol-specific information",
    example: "Protocol-Query: version; security"
  },
  {
    label: "Protocol-Request",
    info: "Specifies protocol-specific requirements",
    example: "Protocol-Request: upgrade-to-tls=required"
  },
  {
    label: "Safe",
    info: "Indicates if the request is safe (read-only)",
    example: "Safe: yes"
  },
  {
    label: "Sec-Purpose",
    info: "Indicates the purpose of the request",
    example: "Sec-Purpose: prefetch"
  },
  {
    label: "Security-Scheme",
    info: "Specifies the security scheme being used",
    example: "Security-Scheme: OAuth2"
  },
  {
    label: "URI",
    info: "Provides the URI of the resource",
    example: "URI: https://api.example.com/v1/resource"
  },
  {
    label: "Want-Digest",
    info: "Indicates which digest algorithms are wanted",
    example: "Want-Digest: sha-256"
  }
] as const;
