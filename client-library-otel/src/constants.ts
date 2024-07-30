/**
 * SEMATTRS_* are constants that should actually be exposed by the Samantic Conventions package
 * but are not.
 */
export const EXTRA_SEMATTRS_HTTP_REQUEST_METHOD = "http.request.method";
export const EXTRA_SEMATTRS_HTTP_RESPONSE_STATUS_CODE =
  "http.response.status_code";
export const EXTRA_SEMATTRS_URL_FULL = "url.full";

export const FPX_REQUEST_HEADERS_FULL = "fpx.http.request_headers_full";
export const FPX_REQUEST_PATHNAME = "fpx.http.request_pathname";
export const FPX_REQUEST_SEARCH = "fpx.http.request_search";
export const FPX_REQUEST_SCHEME = "fpx.http.request_scheme";
export const FPX_REQUEST_BODY = "fpx.http.request_body";

export const FPX_RESPONSE_HEADERS_FULL = "fpx.http.response_headers_full";
export const FPX_RESPONSE_BODY = "fpx.http.response_body";
